"""Schedule rebuild, hotel bookends, and plan activity helpers."""

from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import inspect as sa_inspect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import set_committed_value

from app.models.travel import PlanActivity, PlanDay, TravelPlan
from app.providers.registry import get_hotel_provider
from app.schemas.travel import (
    DEFAULT_CHECK_IN_TIME,
    DEFAULT_CHECK_OUT_TIME,
    PlanActivityCreate,
    PlanActivityResponse,
    PlanDayResponse,
    TravelPlanDetailResponse,
    TravelPlanResponse,
    inclusive_day_count,
    iter_trip_dates,
    night_count,
    validate_trip_date_range,
)
from app.services import geocode as geocode_service


async def _ensure_schedule_loaded(db: AsyncSession, plan: TravelPlan) -> None:
    """Load plan.days (+ activities) without sync lazy IO in async contexts."""
    state = sa_inspect(plan)
    if "days" not in state.unloaded:
        for day in plan.days:
            if "activities" in sa_inspect(day).unloaded:
                result = await db.execute(
                    select(PlanDay)
                    .where(PlanDay.id == day.id)
                    .options(selectinload(PlanDay.activities))
                )
                loaded = result.scalar_one()
                set_committed_value(day, "activities", list(loaded.activities))
        return

    result = await db.execute(
        select(PlanDay)
        .where(PlanDay.plan_id == plan.id)
        .options(selectinload(PlanDay.activities))
        .order_by(PlanDay.sort_index)
    )
    set_committed_value(plan, "days", list(result.scalars().unique().all()))


ACTIVITY_KIND_CHECK_IN = "check_in"
ACTIVITY_KIND_CHECK_OUT = "check_out"
ACTIVITY_KIND_CUSTOM = "custom"


def _format_day_labels(day_date: date, index: int) -> tuple[str, str, str]:
    label = f"Day {index + 1}"
    short_date = f"{day_date.strftime('%b')} {day_date.day}"
    full_date = f"{day_date.strftime('%A')}, {day_date.strftime('%b')} {day_date.day}"
    return label, short_date, full_date


def plan_summary_fields(plan: TravelPlan) -> dict:
    nights = None
    day_count = None
    if plan.start_date and plan.end_date:
        nights = night_count(plan.start_date, plan.end_date)
        day_count = inclusive_day_count(plan.start_date, plan.end_date)
    return {"nights": nights, "day_count": day_count}


def plan_to_response(plan: TravelPlan) -> TravelPlanResponse:
    return TravelPlanResponse.model_validate(plan, from_attributes=True).model_copy(
        update=plan_summary_fields(plan)
    )


def activity_to_response(activity: PlanActivity) -> PlanActivityResponse:
    return PlanActivityResponse.model_validate(activity, from_attributes=True)


def day_to_response(day: PlanDay, index: int) -> PlanDayResponse:
    label, short_date, full_date = _format_day_labels(day.day_date, index)
    activities = sorted(day.activities, key=lambda item: (item.sort_index, item.time_label))
    return PlanDayResponse(
        id=day.id,
        day_date=day.day_date,
        sort_index=day.sort_index,
        label=label,
        short_date=short_date,
        full_date=full_date,
        activities=[activity_to_response(activity) for activity in activities],
    )


def plan_to_detail(plan: TravelPlan) -> TravelPlanDetailResponse:
    days = sorted(plan.days, key=lambda item: item.sort_index)
    summary = plan_to_response(plan)
    return TravelPlanDetailResponse(
        **summary.model_dump(),
        days=[day_to_response(day, index) for index, day in enumerate(days)],
    )


async def load_plan_with_schedule(
    db: AsyncSession, user_id: UUID, plan_id: UUID
) -> TravelPlan:
    result = await db.execute(
        select(TravelPlan)
        .where(TravelPlan.id == plan_id, TravelPlan.user_id == user_id)
        .options(selectinload(TravelPlan.days).selectinload(PlanDay.activities))
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel plan not found")
    return plan


def hotel_display_name(plan: TravelPlan) -> str:
    name = (plan.hotel_name or "").strip()
    return name or "your hotel"


async def resolve_hotel_times(plan: TravelPlan) -> tuple[str, str]:
    check_in = DEFAULT_CHECK_IN_TIME
    check_out = DEFAULT_CHECK_OUT_TIME
    hotel_id = (plan.hotel_provider_id or "").strip()
    if not hotel_id:
        return check_in, check_out

    try:
        provider = get_hotel_provider()
        details = await provider.get_hotel_details(hotel_id)
        meta = details.metadata_json or {}
        if meta.get("check_in_time"):
            check_in = str(meta["check_in_time"]).strip() or check_in
        if meta.get("check_out_time"):
            check_out = str(meta["check_out_time"]).strip() or check_out
        if not plan.hotel_name and details.name:
            plan.hotel_name = details.name
        if not plan.hotel_provider:
            plan.hotel_provider = details.provider
    except Exception:
        # Offline / mock miss / LiteAPI errors → keep defaults.
        return check_in, check_out

    return check_in, check_out


def _upsert_bookend(
    day: PlanDay,
    *,
    kind: str,
    time_label: str,
    title: str,
    location: str,
    sort_index: int,
) -> None:
    existing = next((activity for activity in day.activities if activity.kind == kind), None)
    if existing is None:
        day.activities.append(
            PlanActivity(
                kind=kind,
                time_label=time_label,
                title=title,
                location=location,
                category="travel",
                tag_label=None,
                sort_index=sort_index,
            )
        )
        return

    existing.time_label = time_label
    existing.title = title
    existing.location = location
    existing.category = "travel"
    existing.sort_index = sort_index


async def upsert_hotel_bookends(db: AsyncSession, plan: TravelPlan) -> None:
    await _ensure_schedule_loaded(db, plan)
    if not plan.days:
        return

    ordered = sorted(plan.days, key=lambda item: item.sort_index)
    first_day = ordered[0]
    last_day = ordered[-1]
    check_in_time, check_out_time = await resolve_hotel_times(plan)
    name = hotel_display_name(plan)
    location = plan.destination_name

    _upsert_bookend(
        first_day,
        kind=ACTIVITY_KIND_CHECK_IN,
        time_label=check_in_time,
        title=f"Check in {name}",
        location=location,
        sort_index=0,
    )
    _upsert_bookend(
        last_day,
        kind=ACTIVITY_KIND_CHECK_OUT,
        time_label=check_out_time,
        title=f"Check out of {name}",
        location=location,
        sort_index=10_000 if first_day.id != last_day.id else 1,
    )

    # Same calendar day: keep check-in before check-out even when times look inverted.
    if first_day.id == last_day.id:
        check_in = next(a for a in first_day.activities if a.kind == ACTIVITY_KIND_CHECK_IN)
        check_out = next(a for a in first_day.activities if a.kind == ACTIVITY_KIND_CHECK_OUT)
        check_in.sort_index = 0
        check_out.sort_index = max(check_out.sort_index, 1)

    await db.flush()


async def rebuild_plan_days(db: AsyncSession, plan: TravelPlan) -> None:
    if plan.start_date is None or plan.end_date is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="start_date and end_date are required to build an itinerary",
        )

    try:
        dates = iter_trip_dates(plan.start_date, plan.end_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    await _ensure_schedule_loaded(db, plan)
    existing_by_date = {day.day_date: day for day in list(plan.days)}
    kept: list[PlanDay] = []

    for index, day_date in enumerate(dates):
        day = existing_by_date.pop(day_date, None)
        if day is None:
            day = PlanDay(plan_id=plan.id, day_date=day_date, sort_index=index, activities=[])
            plan.days.append(day)
        else:
            day.sort_index = index
        kept.append(day)

    for leftover in list(existing_by_date.values()):
        plan.days.remove(leftover)
        await db.delete(leftover)

    await db.flush()
    await upsert_hotel_bookends(db, plan)


async def ensure_plan_center(plan: TravelPlan) -> None:
    if plan.center_lat is not None and plan.center_lng is not None:
        return
    resolved = await geocode_service.search_geocode(plan.destination_name)
    if not resolved:
        return
    plan.center_lat = resolved.get("lat")
    plan.center_lng = resolved.get("lng")


async def create_activity(
    db: AsyncSession,
    user_id: UUID,
    plan_id: UUID,
    day_id: UUID,
    body: PlanActivityCreate,
) -> PlanActivity:
    plan = await load_plan_with_schedule(db, user_id, plan_id)
    day = next((item for item in plan.days if item.id == day_id), None)
    if day is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan day not found")

    lat = None
    lng = None
    query = f"{body.location}, {plan.destination_name}".strip(", ")
    resolved = await geocode_service.search_geocode(query)
    if resolved:
        lat = resolved.get("lat")
        lng = resolved.get("lng")

    sort_index = max((activity.sort_index for activity in day.activities), default=0) + 1
    activity = PlanActivity(
        day_id=day.id,
        kind=ACTIVITY_KIND_CUSTOM,
        time_label=body.time_label.strip(),
        title=body.title.strip(),
        location=body.location.strip(),
        category=(body.category or "food").strip() or "food",
        tag_label=(body.tag_label or "").strip() or None,
        lat=lat,
        lng=lng,
        sort_index=sort_index,
    )
    day.activities.append(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


async def delete_activity(db: AsyncSession, user_id: UUID, plan_id: UUID, activity_id: UUID) -> None:
    plan = await load_plan_with_schedule(db, user_id, plan_id)
    target: PlanActivity | None = None
    for day in plan.days:
        for activity in day.activities:
            if activity.id == activity_id:
                target = activity
                break
        if target:
            break

    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")

    if target.kind in (ACTIVITY_KIND_CHECK_IN, ACTIVITY_KIND_CHECK_OUT):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in and check-out stops are managed with the trip hotel and dates.",
        )

    await db.delete(target)
    await db.commit()

from datetime import UTC, date, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.travel import Favorite, PlanDay, TravelPlan
from app.schemas.travel import TravelPlanCreate, TravelPlanUpdate, validate_trip_date_range
from app.services import favorites as favorites_service
from app.services import itinerary as itinerary_service

PLAN_STATUS_ACTIVE = "active"
PLAN_STATUS_COMPLETED = "completed"
PLAN_FAVORITE_ITEM_TYPE = favorites_service.PLAN_FAVORITE_ITEM_TYPE
PLAN_FAVORITE_PROVIDER = favorites_service.PLAN_FAVORITE_PROVIDER


def _should_auto_complete(plan: TravelPlan, today: date) -> bool:
    return (
        plan.status == PLAN_STATUS_ACTIVE
        and not plan.suppress_auto_complete
        and plan.end_date is not None
        and plan.end_date < today
    )


async def apply_auto_complete(db: AsyncSession, plans: list[TravelPlan]) -> list[TravelPlan]:
    """Lazy-complete past-dated active trips unless reopen suppressed auto-complete."""
    today = date.today()
    dirty = False
    now = datetime.now(UTC)
    for plan in plans:
        if _should_auto_complete(plan, today):
            plan.status = PLAN_STATUS_COMPLETED
            plan.completed_at = now
            dirty = True
    if dirty:
        await db.commit()
        for plan in plans:
            await db.refresh(plan)
    return plans


async def list_plans(
    db: AsyncSession,
    user_id: UUID,
    *,
    status_filter: str = "all",
) -> list[TravelPlan]:
    result = await db.execute(
        select(TravelPlan)
        .where(TravelPlan.user_id == user_id)
        .order_by(TravelPlan.updated_at.desc())
    )
    plans = list(result.scalars().all())
    await apply_auto_complete(db, plans)

    if status_filter == PLAN_STATUS_ACTIVE:
        return [plan for plan in plans if plan.status == PLAN_STATUS_ACTIVE]
    if status_filter == PLAN_STATUS_COMPLETED:
        return [plan for plan in plans if plan.status == PLAN_STATUS_COMPLETED]
    return plans


async def get_plan(db: AsyncSession, user_id: UUID, plan_id: UUID) -> TravelPlan:
    plan = await itinerary_service.load_plan_with_schedule(db, user_id, plan_id)
    await apply_auto_complete(db, [plan])
    plan = await itinerary_service.load_plan_with_schedule(db, user_id, plan_id)
    # Repair blank covers from the old dead OSM staticmap host.
    if itinerary_service._cover_needs_refresh(plan.cover_image_url):
        await itinerary_service.ensure_plan_center(plan)
        await db.commit()
        plan = await itinerary_service.load_plan_with_schedule(db, user_id, plan_id)
    return plan


async def create_plan(db: AsyncSession, user_id: UUID, body: TravelPlanCreate) -> TravelPlan:
    try:
        validate_trip_date_range(body.start_date, body.end_date)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc

    payload = body.model_dump()
    if payload.get("hotel_name"):
        payload["hotel_name"] = payload["hotel_name"].strip() or None
    if payload.get("hotel_provider"):
        payload["hotel_provider"] = payload["hotel_provider"].strip() or None
    if payload.get("hotel_provider_id"):
        payload["hotel_provider_id"] = payload["hotel_provider_id"].strip() or None

    plan = TravelPlan(
        user_id=user_id,
        status=PLAN_STATUS_ACTIVE,
        suppress_auto_complete=False,
        **payload,
    )
    db.add(plan)
    await db.flush()
    await itinerary_service.ensure_plan_center(plan)
    await itinerary_service.rebuild_plan_days(db, plan)
    await db.commit()
    return await itinerary_service.load_plan_with_schedule(db, user_id, plan.id)


def _apply_status_change(plan: TravelPlan, new_status: str) -> None:
    if new_status == PLAN_STATUS_COMPLETED:
        plan.status = PLAN_STATUS_COMPLETED
        plan.completed_at = datetime.now(UTC)
        return
    if new_status == PLAN_STATUS_ACTIVE:
        plan.status = PLAN_STATUS_ACTIVE
        plan.completed_at = None
        # Keep past-dated reopened trips from flipping back on the next list.
        plan.suppress_auto_complete = True
        return
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="status must be active or completed",
    )


async def update_plan(
    db: AsyncSession, user_id: UUID, plan_id: UUID, body: TravelPlanUpdate
) -> TravelPlan:
    plan = await itinerary_service.load_plan_with_schedule(db, user_id, plan_id)
    changes = body.model_dump(exclude_unset=True)

    previous_start = plan.start_date
    previous_end = plan.end_date
    previous_hotel = (
        plan.hotel_name,
        plan.hotel_provider,
        plan.hotel_provider_id,
    )

    status_change = changes.pop("status", None)

    for field, value in changes.items():
        if isinstance(value, str) and field in {
            "hotel_name",
            "hotel_provider",
            "hotel_provider_id",
        }:
            value = value.strip() or None
        setattr(plan, field, value)

    if plan.start_date and plan.end_date:
        try:
            validate_trip_date_range(plan.start_date, plan.end_date)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
            ) from exc
    if (
        plan.budget_min is not None
        and plan.budget_max is not None
        and plan.budget_max < plan.budget_min
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="budget_max must be greater than or equal to budget_min",
        )

    dates_changed = previous_start != plan.start_date or previous_end != plan.end_date
    hotel_changed = previous_hotel != (
        plan.hotel_name,
        plan.hotel_provider,
        plan.hotel_provider_id,
    )
    destination_changed = "destination_name" in changes

    if dates_changed:
        # New dates re-enable auto-complete for future end dates.
        plan.suppress_auto_complete = False

    if status_change is not None:
        _apply_status_change(plan, status_change)

    if destination_changed:
        await itinerary_service.refresh_plan_cover_from_destination(plan)
    elif "cover_image_url" not in changes:
        await itinerary_service.ensure_plan_center(plan)

    if dates_changed:
        await itinerary_service.rebuild_plan_days(db, plan)
    elif hotel_changed or destination_changed:
        await itinerary_service.upsert_hotel_bookends(db, plan)

    await favorites_service.sync_plan_favorite_snapshot(db, user_id, plan)
    await db.commit()
    return await itinerary_service.load_plan_with_schedule(db, user_id, plan.id)


async def delete_plan(db: AsyncSession, user_id: UUID, plan_id: UUID) -> None:
    result = await db.execute(
        select(TravelPlan)
        .where(TravelPlan.id == plan_id, TravelPlan.user_id == user_id)
        .options(selectinload(TravelPlan.days).selectinload(PlanDay.activities))
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel plan not found")

    await db.execute(
        delete(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.item_type == PLAN_FAVORITE_ITEM_TYPE,
            Favorite.provider == PLAN_FAVORITE_PROVIDER,
            Favorite.provider_item_id == str(plan_id),
        )
    )
    await db.delete(plan)
    await db.commit()

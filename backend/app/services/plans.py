from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.travel import PlanDay, TravelPlan
from app.schemas.travel import TravelPlanCreate, TravelPlanUpdate, validate_trip_date_range
from app.services import itinerary as itinerary_service


async def list_plans(db: AsyncSession, user_id: UUID) -> list[TravelPlan]:
    result = await db.execute(
        select(TravelPlan).where(TravelPlan.user_id == user_id).order_by(TravelPlan.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_plan(db: AsyncSession, user_id: UUID, plan_id: UUID) -> TravelPlan:
    return await itinerary_service.load_plan_with_schedule(db, user_id, plan_id)


async def create_plan(db: AsyncSession, user_id: UUID, body: TravelPlanCreate) -> TravelPlan:
    try:
        validate_trip_date_range(body.start_date, body.end_date)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    payload = body.model_dump()
    if payload.get("hotel_name"):
        payload["hotel_name"] = payload["hotel_name"].strip() or None
    if payload.get("hotel_provider"):
        payload["hotel_provider"] = payload["hotel_provider"].strip() or None
    if payload.get("hotel_provider_id"):
        payload["hotel_provider_id"] = payload["hotel_provider_id"].strip() or None

    plan = TravelPlan(user_id=user_id, **payload)
    db.add(plan)
    await db.flush()
    await itinerary_service.ensure_plan_center(plan)
    await itinerary_service.rebuild_plan_days(db, plan)
    await db.commit()
    return await itinerary_service.load_plan_with_schedule(db, user_id, plan.id)


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

    for field, value in changes.items():
        if isinstance(value, str) and field in {"hotel_name", "hotel_provider", "hotel_provider_id"}:
            value = value.strip() or None
        setattr(plan, field, value)

    if plan.start_date and plan.end_date:
        try:
            validate_trip_date_range(plan.start_date, plan.end_date)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
            ) from exc
    if plan.budget_min is not None and plan.budget_max is not None and plan.budget_max < plan.budget_min:
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

    if destination_changed:
        await itinerary_service.ensure_plan_center(plan)

    if dates_changed:
        await itinerary_service.rebuild_plan_days(db, plan)
    elif hotel_changed or destination_changed:
        await itinerary_service.upsert_hotel_bookends(db, plan)

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
    await db.delete(plan)
    await db.commit()

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import TravelPlan
from app.schemas.travel import TravelPlanCreate, TravelPlanUpdate


async def list_plans(db: AsyncSession, user_id: UUID) -> list[TravelPlan]:
    result = await db.execute(
        select(TravelPlan).where(TravelPlan.user_id == user_id).order_by(TravelPlan.created_at.desc())
    )
    return list(result.scalars().all())


async def get_plan(db: AsyncSession, user_id: UUID, plan_id: UUID) -> TravelPlan:
    result = await db.execute(
        select(TravelPlan).where(TravelPlan.id == plan_id, TravelPlan.user_id == user_id)
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Travel plan not found")
    return plan


async def create_plan(db: AsyncSession, user_id: UUID, body: TravelPlanCreate) -> TravelPlan:
    plan = TravelPlan(user_id=user_id, **body.model_dump())
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


async def update_plan(
    db: AsyncSession, user_id: UUID, plan_id: UUID, body: TravelPlanUpdate
) -> TravelPlan:
    plan = await get_plan(db, user_id, plan_id)
    changes = body.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(plan, field, value)
    if plan.start_date and plan.end_date and plan.end_date < plan.start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="end_date must be on or after start_date",
        )
    if plan.budget_min is not None and plan.budget_max is not None and plan.budget_max < plan.budget_min:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="budget_max must be greater than or equal to budget_min",
        )
    await db.commit()
    await db.refresh(plan)
    return plan


async def delete_plan(db: AsyncSession, user_id: UUID, plan_id: UUID) -> None:
    plan = await get_plan(db, user_id, plan_id)
    await db.delete(plan)
    await db.commit()

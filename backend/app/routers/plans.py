from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.travel import (
    PlanActivityCreate,
    PlanActivityResponse,
    TravelPlanCreate,
    TravelPlanDetailResponse,
    TravelPlanResponse,
    TravelPlanUpdate,
)
from app.services import itinerary as itinerary_service
from app.services import plans as plan_service

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[TravelPlanResponse])
async def list_plans(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    status_filter: Annotated[
        Literal["active", "completed", "all"],
        Query(alias="status", description="Filter by plan lifecycle status"),
    ] = "all",
):
    plans = await plan_service.list_plans(db, current_user.id, status_filter=status_filter)
    return [itinerary_service.plan_to_response(plan) for plan in plans]


@router.post("", response_model=TravelPlanDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    body: TravelPlanCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    plan = await plan_service.create_plan(db, current_user.id, body)
    return itinerary_service.plan_to_detail(plan)


@router.get("/{plan_id}", response_model=TravelPlanDetailResponse)
async def get_plan(
    plan_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    plan = await plan_service.get_plan(db, current_user.id, plan_id)
    return itinerary_service.plan_to_detail(plan)


@router.patch("/{plan_id}", response_model=TravelPlanDetailResponse)
async def update_plan(
    plan_id: UUID,
    body: TravelPlanUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    plan = await plan_service.update_plan(db, current_user.id, plan_id, body)
    return itinerary_service.plan_to_detail(plan)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await plan_service.delete_plan(db, current_user.id, plan_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{plan_id}/days/{day_id}/activities",
    response_model=PlanActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_activity(
    plan_id: UUID,
    day_id: UUID,
    body: PlanActivityCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    activity = await itinerary_service.create_activity(db, current_user.id, plan_id, day_id, body)
    return itinerary_service.activity_to_response(activity)


@router.delete("/{plan_id}/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    plan_id: UUID,
    activity_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await itinerary_service.delete_activity(db, current_user.id, plan_id, activity_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

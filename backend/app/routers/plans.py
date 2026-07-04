from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.travel import TravelPlanCreate, TravelPlanResponse, TravelPlanUpdate
from app.services import plans as plan_service

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=list[TravelPlanResponse])
async def list_plans(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await plan_service.list_plans(db, current_user.id)


@router.post("", response_model=TravelPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    body: TravelPlanCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await plan_service.create_plan(db, current_user.id, body)


@router.get("/{plan_id}", response_model=TravelPlanResponse)
async def get_plan(
    plan_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await plan_service.get_plan(db, current_user.id, plan_id)


@router.patch("/{plan_id}", response_model=TravelPlanResponse)
async def update_plan(
    plan_id: UUID,
    body: TravelPlanUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await plan_service.update_plan(db, current_user.id, plan_id, body)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await plan_service.delete_plan(db, current_user.id, plan_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

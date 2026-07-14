from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import FareProvider
from app.providers.registry import get_fare_provider
from app.routers.auth import get_current_user
from app.schemas.travel import FareEventResponse, FareWatchCreate, FareWatchResponse
from app.services import fares as fare_service

router = APIRouter(prefix="/fare-watches", tags=["fare-watches"])


@router.get("", response_model=list[FareWatchResponse])
async def list_watches(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await fare_service.list_watches(db, current_user.id)


@router.post("", response_model=FareWatchResponse, status_code=status.HTTP_201_CREATED)
async def create_watch(
    body: FareWatchCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: Annotated[FareProvider, Depends(get_fare_provider)],
):
    return await fare_service.create_watch(db, provider, current_user.id, body)


@router.delete("/{watch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_watch(
    watch_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await fare_service.delete_watch(db, current_user.id, watch_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{watch_id}/events", response_model=list[FareEventResponse])
async def list_events(
    watch_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await fare_service.list_events(db, current_user.id, watch_id)

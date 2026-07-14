from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import FavoriteCreateRequest, FavoriteItemResponse
from app.services import favorites as favorites_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteItemResponse])
async def list_favorites(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await favorites_service.list_favorites(db, current_user.id)


@router.post("", response_model=FavoriteItemResponse, status_code=status.HTTP_201_CREATED)
async def create_favorite(
    body: FavoriteCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await favorites_service.upsert_favorite(db, current_user.id, body)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    item_type: Annotated[str, Query(min_length=1, max_length=50)],
    provider: Annotated[str, Query(min_length=1, max_length=50)],
    provider_item_id: Annotated[str, Query(min_length=1, max_length=255)],
):
    await favorites_service.delete_favorite(
        db,
        current_user.id,
        item_type=item_type,
        provider=provider,
        provider_item_id=provider_item_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

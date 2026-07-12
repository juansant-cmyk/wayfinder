from typing import Annotated

from fastapi import APIRouter, Depends

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import FavoriteItemResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("", response_model=list[FavoriteItemResponse])
async def list_favorites(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return dashboard_service.list_favorites(current_user.id)

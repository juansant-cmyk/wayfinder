from typing import Annotated

from fastapi import APIRouter, Depends

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import NotificationResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return dashboard_service.list_notifications(current_user.id)

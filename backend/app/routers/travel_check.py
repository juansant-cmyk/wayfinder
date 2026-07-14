from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import TravelCheckResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/travel-check", tags=["travel-check"])


@router.get("", response_model=TravelCheckResponse)
async def travel_check(
    current_user: Annotated[User, Depends(get_current_user)],
    destination: str | None = Query(default=None, max_length=255),
):
    return dashboard_service.get_travel_check(destination)

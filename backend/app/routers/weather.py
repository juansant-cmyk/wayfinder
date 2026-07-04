from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import WeatherResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherResponse)
async def current_weather(
    current_user: Annotated[User, Depends(get_current_user)],
    destination: str | None = Query(default=None, max_length=255),
):
    return dashboard_service.get_weather(destination)

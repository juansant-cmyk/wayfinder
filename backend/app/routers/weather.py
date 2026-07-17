from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.providers.base import CurrentWeatherProvider
from app.providers.registry import get_current_weather_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import WeatherResponse
from app.services import weather as weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current", response_model=WeatherResponse)
async def current_weather(
    current_user: Annotated[User, Depends(get_current_user)],
    provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    destination: str | None = Query(default=None, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
):
    return await weather_service.current_weather(provider, destination, lat, lng)

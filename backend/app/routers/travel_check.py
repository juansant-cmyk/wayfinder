from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.providers.base import CurrentWeatherProvider
from app.providers.registry import get_current_weather_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import TravelCheckResponse
from app.services import dashboard as dashboard_service
from app.services import weather as weather_service

router = APIRouter(prefix="/travel-check", tags=["travel-check"])


@router.get("", response_model=TravelCheckResponse)
async def travel_check(
    current_user: Annotated[User, Depends(get_current_user)],
    weather_provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    destination: str | None = Query(default=None, max_length=255),
):
    target_destination = destination or "Bali"
    safety = dashboard_service.get_safety_summary(target_destination)
    weather = await weather_service.current_weather(
        weather_provider, target_destination, None, None
    )
    return TravelCheckResponse(
        destination=safety.destination,
        safety=safety,
        weather=weather,
        summary=f"{weather.condition} with {safety.overall_level} safety conditions.",
    )

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import CurrentWeatherProvider, TravelRiskProvider
from app.providers.registry import get_current_weather_provider, get_travel_risk_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import TravelCheckResponse
from app.services import safety as safety_service
from app.services import weather as weather_service

router = APIRouter(prefix="/travel-check", tags=["travel-check"])


@router.get("", response_model=TravelCheckResponse)
async def travel_check(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    weather_provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    travel_risk_provider: Annotated[TravelRiskProvider, Depends(get_travel_risk_provider)],
    destination: str | None = Query(default=None, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    country_iso: str | None = Query(default=None, min_length=2, max_length=3),
):
    target_destination = destination or "Bali, Indonesia"
    report = await safety_service.safety_report(
        db,
        travel_risk_provider,
        weather_provider,
        current_user.id,
        target_destination,
        lat,
        lng,
        country_iso,
    )
    safety = safety_service.summary_from_report(report)
    weather = await weather_service.current_weather(
        weather_provider, target_destination, lat, lng
    )
    return TravelCheckResponse(
        destination=safety.destination,
        safety=safety,
        weather=weather,
        summary=f"{weather.condition} with {safety.overall_level} safety conditions.",
    )

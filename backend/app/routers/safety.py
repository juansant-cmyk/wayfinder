from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import TravelAdvisoryProvider, WeatherProvider
from app.providers.registry import get_travel_advisory_provider, get_weather_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import SafetySummaryResponse
from app.schemas.travel import DismissAlertResponse, SafetyFeedAlertResponse
from app.services import dashboard as dashboard_service
from app.services import safety as safety_service

router = APIRouter(tags=["safety"])


@router.get("/safety/summary", response_model=SafetySummaryResponse)
async def safety_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    destination: str | None = Query(default=None, max_length=255),
):
    return dashboard_service.get_safety_summary(destination)


@router.get("/safety", response_model=list[SafetyFeedAlertResponse])
async def safety_alerts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    weather_provider: Annotated[WeatherProvider, Depends(get_weather_provider)],
    advisory_provider: Annotated[TravelAdvisoryProvider, Depends(get_travel_advisory_provider)],
    destination: str = Query(min_length=1, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
):
    return await safety_service.safety_alerts(
        db,
        weather_provider,
        advisory_provider,
        current_user.id,
        lat,
        lng,
        destination,
    )


@router.post("/alerts/{alert_id}/dismiss", response_model=DismissAlertResponse)
async def dismiss_alert(
    alert_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await safety_service.dismiss_alert(db, current_user.id, alert_id)
    return DismissAlertResponse(alert_id=alert_id)

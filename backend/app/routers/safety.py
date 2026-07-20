from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import CurrentWeatherProvider, TravelRiskProvider
from app.providers.registry import get_current_weather_provider, get_travel_risk_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import SafetySummaryResponse
from app.schemas.safety import SafetyReportResponse
from app.schemas.travel import DismissAlertResponse, SafetyFeedAlertResponse
from app.services import safety as safety_service

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/summary", response_model=SafetySummaryResponse)
async def safety_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    weather_provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    travel_risk_provider: Annotated[TravelRiskProvider, Depends(get_travel_risk_provider)],
    destination: str | None = Query(default=None, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    country_iso: str | None = Query(default=None, min_length=2, max_length=3),
):
    report = await safety_service.safety_report(
        db,
        travel_risk_provider,
        weather_provider,
        current_user.id,
        destination or "Bali, Indonesia",
        lat,
        lng,
        country_iso,
    )
    return safety_service.summary_from_report(report)


@router.get("/report", response_model=SafetyReportResponse)
async def safety_report(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    weather_provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    travel_risk_provider: Annotated[TravelRiskProvider, Depends(get_travel_risk_provider)],
    destination: str = Query(min_length=1, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    country_iso: str | None = Query(default=None, min_length=2, max_length=3),
):
    return await safety_service.safety_report(
        db,
        travel_risk_provider,
        weather_provider,
        current_user.id,
        destination,
        lat,
        lng,
        country_iso,
    )


@router.get("", response_model=list[SafetyFeedAlertResponse])
async def safety_alerts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    weather_provider: Annotated[CurrentWeatherProvider, Depends(get_current_weather_provider)],
    travel_risk_provider: Annotated[TravelRiskProvider, Depends(get_travel_risk_provider)],
    destination: str = Query(min_length=1, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    country_iso: str | None = Query(default=None, min_length=2, max_length=3),
):
    return await safety_service.safety_alerts(
        db,
        travel_risk_provider,
        weather_provider,
        current_user.id,
        lat,
        lng,
        destination,
        country_iso,
    )


@router.post("/alerts/{alert_id}/dismiss", response_model=DismissAlertResponse)
async def dismiss_alert(
    alert_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    await safety_service.dismiss_alert(db, current_user.id, alert_id)
    return DismissAlertResponse(alert_id=alert_id)

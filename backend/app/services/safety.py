import hashlib
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.travel import AlertDismissal, SafetyAlert
from app.providers.base import ProviderSafetyAlert, TravelAdvisoryProvider, WeatherProvider
from app.providers.mock import MockWeatherProvider
from app.providers.weatherapi import (
    WeatherApiLocationNotFound,
    WeatherApiMissingKey,
    WeatherApiUnavailable,
)


async def safety_alerts(
    db: AsyncSession,
    weather_provider: WeatherProvider,
    advisory_provider: TravelAdvisoryProvider,
    user_id: UUID,
    lat: float | None,
    lng: float | None,
    destination: str,
) -> list[SafetyAlert]:
    provider_alerts: list[ProviderSafetyAlert] = []
    try:
        provider_alerts.extend(await weather_provider.alerts(lat, lng, destination))
    except WeatherApiLocationNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weather location not found",
        ) from exc
    except WeatherApiMissingKey as exc:
        if settings.use_mock_providers:
            provider_alerts.extend(await MockWeatherProvider().alerts(lat, lng, destination))
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="WEATHER_API_KEY is required for WeatherAPI",
            ) from exc
    except WeatherApiUnavailable as exc:
        if settings.use_mock_providers:
            provider_alerts.extend(await MockWeatherProvider().alerts(lat, lng, destination))
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Weather provider unavailable",
            ) from exc
    provider_alerts.extend(await advisory_provider.alerts(destination))
    for alert in provider_alerts:
        await _upsert_alert(db, alert, destination)
    await db.commit()

    result = await db.execute(
        select(SafetyAlert)
        .outerjoin(
            AlertDismissal,
            (AlertDismissal.alert_id == SafetyAlert.id)
            & (AlertDismissal.user_id == user_id),
        )
        .where(
            func.lower(SafetyAlert.destination) == destination.strip().lower(),
            or_(SafetyAlert.ends_at.is_(None), SafetyAlert.ends_at > func.now()),
            AlertDismissal.id.is_(None),
        )
        .order_by(SafetyAlert.starts_at.desc().nullslast(), SafetyAlert.created_at.desc())
    )
    return list(result.scalars().all())


async def dismiss_alert(db: AsyncSession, user_id: UUID, alert_id: UUID) -> None:
    alert = await db.get(SafetyAlert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Safety alert not found")

    result = await db.execute(
        select(AlertDismissal).where(
            AlertDismissal.user_id == user_id,
            AlertDismissal.alert_id == alert_id,
        )
    )
    if result.scalar_one_or_none() is None:
        db.add(AlertDismissal(user_id=user_id, alert_id=alert_id))
        await db.commit()


def normalize_severity(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized == "extreme":
        return "extreme"
    if normalized in {"severe", "high", "danger", "critical"}:
        return "high"
    if normalized in {"moderate", "advisory", "warning", "watch"}:
        return "moderate"
    return "low"


def alert_dedupe_key(item: ProviderSafetyAlert, destination: str) -> str:
    identity = "|".join(
        (
            item.source.strip().lower(),
            destination.strip().lower(),
            (item.event or item.title).strip().lower(),
            item.starts_at.isoformat() if item.starts_at else "",
            item.ends_at.isoformat() if item.ends_at else "",
        )
    )
    return hashlib.sha256(identity.encode("utf-8")).hexdigest()


async def _upsert_alert(
    db: AsyncSession, item: ProviderSafetyAlert, destination: str
) -> SafetyAlert:
    destination = destination.strip()
    dedupe_key = alert_dedupe_key(item, destination)
    result = await db.execute(
        select(SafetyAlert).where(
            SafetyAlert.source == item.source,
            or_(
                SafetyAlert.dedupe_key == dedupe_key,
                (
                    SafetyAlert.dedupe_key.like("legacy:%")
                    & (SafetyAlert.destination == destination)
                    & (SafetyAlert.alert_type == item.alert_type)
                    & (SafetyAlert.title == item.title)
                ),
            ),
        )
    )
    alert = result.scalar_one_or_none()
    fields = {
        "dedupe_key": dedupe_key,
        "destination": destination,
        "severity": normalize_severity(item.severity),
        "description": item.description,
        "lat": item.lat,
        "lng": item.lng,
        "starts_at": item.starts_at,
        "ends_at": item.ends_at,
        "headline": item.headline,
        "urgency": item.urgency,
        "areas": item.areas,
        "event": item.event,
        "instruction": item.instruction,
    }
    if alert is None:
        alert = SafetyAlert(
            source=item.source,
            alert_type=item.alert_type,
            title=item.title,
            **fields,
        )
        db.add(alert)
    else:
        for key, value in fields.items():
            setattr(alert, key, value)
    await db.flush()
    return alert

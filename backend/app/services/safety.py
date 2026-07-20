import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.travel import AlertDismissal, SafetyAlert, SafetyRiskSnapshot
from app.providers.base import (
    CurrentWeatherProvider,
    ProviderSafetyAlert,
    ProviderTravelRiskReport,
    TravelRiskProvider,
)
from app.providers.mock import MockTravelRiskProvider
from app.providers.travelrisk import (
    TravelRiskCountryNotFound,
    TravelRiskMissingKey,
    TravelRiskUnavailable,
)
from app.schemas.dashboard import SafetyAlertResponse, SafetySummaryResponse, WeatherResponse
from app.schemas.safety import (
    SafetyCategoryResponse,
    SafetyCoverageResponse,
    SafetyLocationResponse,
    SafetyReportResponse,
    SafetyRiskResponse,
    SafetyTipResponse,
)
from app.schemas.travel import SafetyFeedAlertResponse
from app.services import geocode as geocode_service
from app.services import weather as weather_service


TIP_LIBRARY = {
    "earthquake": (
        "Prepare for earthquake shaking",
        "Move away from windows and unsecured objects when shaking starts.",
        "Drop, cover, and hold on, then follow local emergency instructions.",
    ),
    "flood": (
        "Avoid flood water",
        "Do not walk or drive through flooded roads or low-lying crossings.",
        "Move to higher ground and follow evacuation instructions when issued.",
    ),
    "cyclone": (
        "Monitor cyclone guidance",
        "Confirm shelter options and expect transport interruptions.",
        "Follow local evacuation orders and keep devices charged.",
    ),
    "wildfire": (
        "Stay clear of wildfire areas",
        "Monitor evacuation zones and avoid roads needed by emergency crews.",
        "Limit smoke exposure and leave early when officials recommend evacuation.",
    ),
    "volcano": (
        "Follow volcanic exclusion zones",
        "Stay outside restricted areas and monitor ash and aviation notices.",
        "Protect your eyes and lungs from ash and follow local authority guidance.",
    ),
    "drought": (
        "Plan for drought conditions",
        "Check local water restrictions and heat guidance before travel.",
        "Carry drinking water and avoid activities restricted by local authorities.",
    ),
    "weather": (
        "Monitor severe weather",
        "Review the warning area and timing before heading out.",
        "Follow official instructions and adjust travel around hazardous conditions.",
    ),
}


def normalize_severity(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"extreme", "critical"}:
        return "extreme"
    if normalized in {"severe", "high", "danger"}:
        return "high"
    if normalized in {"medium", "moderate", "advisory", "warning", "watch"}:
        return "moderate"
    return "low"


def score_to_level(score: float) -> str:
    if score >= 3.5:
        return "extreme"
    if score >= 2.5:
        return "high"
    if score >= 1.5:
        return "moderate"
    return "low"


def alert_dedupe_key(item: ProviderSafetyAlert, destination: str) -> str:
    if item.provider_alert_id:
        identity = f"{item.source.strip().lower()}|{item.provider_alert_id.strip().lower()}"
    else:
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


async def _resolve_location(
    destination: str,
    lat: float | None,
    lng: float | None,
    country_iso: str | None,
) -> dict[str, Any]:
    resolved: dict[str, Any] | None = None
    requested_iso = str(country_iso or "").strip().upper()
    if requested_iso:
        alpha2, alpha3 = geocode_service.normalize_country_codes(requested_iso)
        if alpha3 is None:
            raise HTTPException(status_code=422, detail="country_iso must be a valid country code")
    else:
        if lat is not None and lng is not None:
            resolved = await geocode_service.reverse_geocode(lat, lng)
        if resolved is None and destination:
            resolved = await geocode_service.search_geocode(destination)
        alpha2, alpha3 = geocode_service.normalize_country_codes(
            (resolved or {}).get("country_iso")
            or (resolved or {}).get("country_code")
            or (resolved or {}).get("country")
            or destination.split(",")[-1]
        )
    if alpha3 is None:
        raise HTTPException(status_code=404, detail="Could not resolve a country for this location")

    label = str((resolved or {}).get("label") or destination).strip()
    return {
        "label": label,
        "city": (resolved or {}).get("city") or label.split(",")[0].strip(),
        "country": (resolved or {}).get("country"),
        "country_code": alpha2,
        "country_iso": alpha3,
        "lat": (resolved or {}).get("lat", lat),
        "lng": (resolved or {}).get("lng", lng),
    }


def _provider_to_payload(report: ProviderTravelRiskReport) -> dict[str, Any]:
    return {
        "country_iso": report.country_iso,
        "country_name": report.country_name,
        "risk_score": report.risk_score,
        "advisory_level": report.advisory_level,
        "advisory_description": report.advisory_description,
        "advisory_date": report.advisory_date.isoformat() if report.advisory_date else None,
        "last_updated": report.last_updated.isoformat() if report.last_updated else None,
        "active_alert_count": report.active_alert_count,
        "calculation": report.calculation,
        "provider": report.provider,
    }


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _snapshot_report(snapshot: SafetyRiskSnapshot) -> ProviderTravelRiskReport:
    payload = snapshot.payload or {}
    return ProviderTravelRiskReport(
        country_iso=snapshot.country_iso,
        country_name=snapshot.country_name,
        risk_score=float(payload.get("risk_score") or 0),
        advisory_level=payload.get("advisory_level"),
        advisory_description=payload.get("advisory_description"),
        advisory_date=_parse_datetime(payload.get("advisory_date")),
        last_updated=_parse_datetime(payload.get("last_updated")),
        active_alert_count=int(payload.get("active_alert_count") or 0),
        alerts=[],
        calculation=dict(payload.get("calculation") or {}),
        provider=str(payload.get("provider") or "travelrisk"),
    )


async def _save_snapshot(
    db: AsyncSession, report: ProviderTravelRiskReport, fetched_at: datetime
) -> SafetyRiskSnapshot:
    snapshot = await db.get(SafetyRiskSnapshot, report.country_iso)
    if snapshot is None:
        snapshot = SafetyRiskSnapshot(
            country_iso=report.country_iso,
            country_name=report.country_name,
            payload=_provider_to_payload(report),
            fetched_at=fetched_at,
        )
        db.add(snapshot)
    else:
        snapshot.country_name = report.country_name
        snapshot.payload = _provider_to_payload(report)
        snapshot.fetched_at = fetched_at
    await db.flush()
    return snapshot


async def _upsert_alert(
    db: AsyncSession, item: ProviderSafetyAlert, destination: str
) -> SafetyAlert:
    destination = destination.strip()
    dedupe_key = alert_dedupe_key(item, destination)
    conditions = [SafetyAlert.dedupe_key == dedupe_key]
    if item.provider_alert_id:
        conditions.insert(0, SafetyAlert.provider_alert_id == item.provider_alert_id)
    result = await db.execute(
        select(SafetyAlert).where(
            SafetyAlert.source == item.source,
            or_(
                *conditions,
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
        "provider_alert_id": item.provider_alert_id,
        "country_iso": item.country_iso,
        "destination": destination,
        "alert_type": item.alert_type,
        "title": item.title,
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
        "is_active": True,
        "last_seen_at": datetime.now(UTC),
    }
    if alert is None:
        alert = SafetyAlert(source=item.source, **fields)
        db.add(alert)
    else:
        for key, value in fields.items():
            setattr(alert, key, value)
    await db.flush()
    return alert


async def _sync_travelrisk_alerts(
    db: AsyncSession, report: ProviderTravelRiskReport
) -> None:
    provider_ids = {item.provider_alert_id for item in report.alerts if item.provider_alert_id}
    deactivate = update(SafetyAlert).where(
        SafetyAlert.source == "travelrisk",
        SafetyAlert.country_iso == report.country_iso,
    )
    if provider_ids:
        deactivate = deactivate.where(SafetyAlert.provider_alert_id.not_in(provider_ids))
    await db.execute(deactivate.values(is_active=False))
    for item in report.alerts:
        await _upsert_alert(db, item, report.country_name)


def _warning_from_response(raw: dict[str, Any], country_iso: str | None) -> ProviderSafetyAlert:
    return ProviderSafetyAlert(
        source=str(raw.get("source") or "weatherapi"),
        destination=str(raw.get("destination") or "Selected location"),
        alert_type=str(raw.get("alert_type") or "weather"),
        severity=str(raw.get("severity") or "low"),
        title=str(raw.get("title") or "Weather alert"),
        description=str(raw.get("description") or raw.get("desc") or "Weather alert"),
        lat=raw.get("lat"),
        lng=raw.get("lng"),
        starts_at=_parse_datetime(raw.get("starts_at") or raw.get("effective")),
        ends_at=_parse_datetime(raw.get("ends_at") or raw.get("expires")),
        headline=raw.get("headline"),
        urgency=raw.get("urgency"),
        areas=raw.get("areas"),
        event=raw.get("event"),
        instruction=raw.get("instruction"),
        country_iso=country_iso,
    )


async def _visible_alerts(
    db: AsyncSession,
    user_id: UUID,
    destination: str,
    country_iso: str,
) -> list[SafetyAlert]:
    result = await db.execute(
        select(SafetyAlert)
        .outerjoin(
            AlertDismissal,
            (AlertDismissal.alert_id == SafetyAlert.id)
            & (AlertDismissal.user_id == user_id),
        )
        .where(
            or_(
                (SafetyAlert.source == "travelrisk")
                & (SafetyAlert.country_iso == country_iso),
                SafetyAlert.source.in_(("weatherapi", "mock-weather"))
                & (func.lower(SafetyAlert.destination) == destination.strip().lower()),
            ),
            SafetyAlert.is_active.is_(True),
            or_(SafetyAlert.ends_at.is_(None), SafetyAlert.ends_at > func.now()),
            AlertDismissal.id.is_(None),
        )
        .order_by(SafetyAlert.starts_at.desc().nullslast(), SafetyAlert.created_at.desc())
    )
    return list(result.scalars().all())


def _highest_severity(alerts: list[SafetyAlert]) -> str:
    rank = {"low": 0, "moderate": 1, "high": 2, "extreme": 3}
    return max((item.severity for item in alerts), key=lambda value: rank.get(value, 0), default="low")


def _categories(
    report: ProviderTravelRiskReport,
    alerts: list[SafetyAlert],
    weather: WeatherResponse | None,
) -> list[SafetyCategoryResponse]:
    travel_alerts = [item for item in alerts if item.source == "travelrisk"]
    risk_source = "TravelRiskAPI" if report.provider == "travelrisk" else "Mock travel risk data"
    weather_source = (
        "WeatherAPI" if weather and weather.provider == "weatherapi" else "Mock weather data"
    )
    advisory = report.advisory_description or "No advisory description is available."
    aqi = (weather.air_quality or {}).get("us_epa_index") if weather else None
    weather_status = "Unavailable"
    weather_description = "Weather and air-quality data could not be loaded."
    if weather:
        weather_status = weather.condition
        air_text = f" AQI category {aqi}." if aqi is not None else ""
        weather_description = f"UV index {weather.uv if weather.uv is not None else 'unavailable'}.{air_text}"
    disruption_count = len(travel_alerts)
    return [
        SafetyCategoryResponse(
            id="advisory",
            title="Country Advisory",
            status=f"Level {report.advisory_level}" if report.advisory_level is not None else score_to_level(report.risk_score).title(),
            description=advisory,
            source=risk_source,
        ),
        SafetyCategoryResponse(
            id="hazards",
            title="Active Hazards",
            status=f"{len(travel_alerts)} Active" if travel_alerts else "None reported",
            description=f"Highest active severity: {_highest_severity(travel_alerts).title()}." if travel_alerts else "No active country disaster alerts were returned.",
            source=risk_source,
        ),
        SafetyCategoryResponse(
            id="weather",
            title="Weather & Air Quality",
            status=weather_status,
            description=weather_description,
            source=weather_source if weather else "Unavailable",
        ),
        SafetyCategoryResponse(
            id="disruptions",
            title="Travel Disruptions",
            status=f"{disruption_count} Potential" if disruption_count else "None reported",
            description="Active hazards may affect roads, flights, or local services; this is not a transportation safety score.",
            source=risk_source,
        ),
        SafetyCategoryResponse(
            id="updates",
            title="Active Updates",
            status=f"{len(alerts)} Active" if alerts else "None reported",
            description="Current country hazards and destination weather warnings.",
            source=f"{risk_source} and {weather_source}",
        ),
    ]


def _tips(alerts: list[SafetyAlert]) -> list[SafetyTipResponse]:
    selected: list[SafetyTipResponse] = []
    seen: set[str] = set()
    for alert in alerts:
        alert_type = alert.alert_type.lower()
        if alert_type in seen or alert_type not in TIP_LIBRARY:
            continue
        seen.add(alert_type)
        title, description, detail = TIP_LIBRARY[alert_type]
        selected.append(
            SafetyTipResponse(
                id=f"guidance-{alert_type}",
                title=title,
                description=description,
                detail=detail,
                alert_type=alert_type,
            )
        )
        if len(selected) >= 3:
            break
    if not selected:
        selected.append(
            SafetyTipResponse(
                id="guidance-general",
                title="Follow official local guidance",
                description="Monitor local authorities and confirm emergency contacts before travel.",
                detail="Country-level risk data cannot replace instructions from authorities at your exact location.",
            )
        )
    return selected


async def safety_report(
    db: AsyncSession,
    travel_risk_provider: TravelRiskProvider,
    weather_provider: CurrentWeatherProvider,
    user_id: UUID,
    destination: str,
    lat: float | None,
    lng: float | None,
    country_iso: str | None = None,
) -> SafetyReportResponse:
    location = await _resolve_location(destination, lat, lng, country_iso)
    iso = location["country_iso"]
    now = datetime.now(UTC)
    snapshot = await db.get(SafetyRiskSnapshot, iso)
    cache_ttl = timedelta(seconds=max(0, settings.travel_risk_cache_ttl_seconds))
    snapshot_age = now - snapshot.fetched_at if snapshot else None
    is_fresh = snapshot_age is not None and snapshot_age <= cache_ttl
    is_stale = False

    if is_fresh and snapshot is not None:
        provider_report = _snapshot_report(snapshot)
        fetched_at = snapshot.fetched_at
    else:
        try:
            provider_report = await travel_risk_provider.country_report(iso)
            fetched_at = now
            await _sync_travelrisk_alerts(db, provider_report)
            await _save_snapshot(db, provider_report, fetched_at)
        except TravelRiskCountryNotFound as exc:
            raise HTTPException(status_code=404, detail="Travel risk country not found") from exc
        except TravelRiskMissingKey as exc:
            if snapshot is not None:
                provider_report = _snapshot_report(snapshot)
                fetched_at = snapshot.fetched_at
                is_stale = True
            elif settings.use_mock_providers:
                provider_report = await MockTravelRiskProvider().country_report(iso)
                fetched_at = now
                await _sync_travelrisk_alerts(db, provider_report)
                await _save_snapshot(db, provider_report, fetched_at)
            else:
                raise HTTPException(status_code=503, detail="TRAVEL_RISK_API_KEY is required") from exc
        except TravelRiskUnavailable as exc:
            if snapshot is not None:
                provider_report = _snapshot_report(snapshot)
                fetched_at = snapshot.fetched_at
                is_stale = True
            elif settings.use_mock_providers:
                provider_report = await MockTravelRiskProvider().country_report(iso)
                fetched_at = now
                await _sync_travelrisk_alerts(db, provider_report)
                await _save_snapshot(db, provider_report, fetched_at)
            else:
                raise HTTPException(status_code=502, detail="TravelRiskAPI is unavailable") from exc

    weather: WeatherResponse | None = None
    try:
        weather = await weather_service.current_weather(
            weather_provider,
            location["label"],
            location.get("lat"),
            location.get("lng"),
        )
        await db.execute(
            update(SafetyAlert)
            .where(
                SafetyAlert.source.in_(("weatherapi", "mock-weather")),
                func.lower(SafetyAlert.destination) == location["label"].strip().lower(),
            )
            .values(is_active=False)
        )
        for warning in weather.warnings:
            await _upsert_alert(
                db,
                _warning_from_response(warning, iso),
                location["label"],
            )
    except HTTPException:
        weather = None

    await db.commit()
    alerts = await _visible_alerts(db, user_id, location["label"], iso)
    return SafetyReportResponse(
        location=SafetyLocationResponse(
            label=location["label"],
            city=location.get("city"),
            lat=location.get("lat"),
            lng=location.get("lng"),
        ),
        coverage=SafetyCoverageResponse(
            country_name=provider_report.country_name,
            country_iso=provider_report.country_iso,
        ),
        risk=SafetyRiskResponse(
            score=provider_report.risk_score,
            level=score_to_level(provider_report.risk_score),
            advisory_level=provider_report.advisory_level,
            advisory_description=provider_report.advisory_description,
            advisory_date=provider_report.advisory_date,
            updated_at=provider_report.last_updated,
        ),
        alerts=[SafetyFeedAlertResponse.model_validate(item) for item in alerts],
        categories=_categories(provider_report, alerts, weather),
        tips=_tips(alerts),
        weather=weather,
        sources=[
            "TravelRiskAPI" if provider_report.provider == "travelrisk" else "Mock travel risk data",
            *(
                ["WeatherAPI" if weather.provider == "weatherapi" else "Mock weather data"]
                if weather
                else []
            ),
        ],
        fetched_at=fetched_at,
        is_stale=is_stale,
    )


async def safety_alerts(
    db: AsyncSession,
    travel_risk_provider: TravelRiskProvider,
    weather_provider: CurrentWeatherProvider,
    user_id: UUID,
    lat: float | None,
    lng: float | None,
    destination: str,
    country_iso: str | None = None,
) -> list[SafetyFeedAlertResponse]:
    report = await safety_report(
        db,
        travel_risk_provider,
        weather_provider,
        user_id,
        destination,
        lat,
        lng,
        country_iso,
    )
    return report.alerts


def summary_from_report(report: SafetyReportResponse) -> SafetySummaryResponse:
    return SafetySummaryResponse(
        destination=report.location.label,
        overall_level=report.risk.level,
        alerts=[
            SafetyAlertResponse(
                title=item.title,
                severity=item.severity,
                summary=item.description,
            )
            for item in report.alerts
        ],
    )


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

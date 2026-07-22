from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.providers.base import ProviderSafetyAlert, ProviderTravelRiskReport
from app.services.geocode import normalize_country_codes

TRAVEL_RISK_BASE_URL = "https://travelriskapi.com/api/v1"


class TravelRiskError(Exception):
    pass


class TravelRiskMissingKey(TravelRiskError):
    pass


class TravelRiskCountryNotFound(TravelRiskError):
    pass


class TravelRiskUnavailable(TravelRiskError):
    pass


def _parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def normalize_travelrisk_severity(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    return {
        "critical": "extreme",
        "high": "high",
        "medium": "moderate",
        "moderate": "moderate",
        "low": "low",
    }.get(normalized, "low")


def map_travelrisk_alert(raw: dict[str, Any], country_name: str) -> ProviderSafetyAlert | None:
    provider_id = str(raw.get("id") or raw.get("external_id") or "").strip()
    country_iso = str(raw.get("country_iso") or "").strip().upper()
    alert_type = str(raw.get("alert_type") or "hazard").strip().lower()
    description = str(raw.get("description") or "").strip()
    if not provider_id or not description:
        return None
    location = str(raw.get("location") or country_name).strip()
    title = f"{alert_type.replace('_', ' ').title()} alert"
    return ProviderSafetyAlert(
        source="travelrisk",
        destination=country_name,
        alert_type=alert_type,
        severity=normalize_travelrisk_severity(raw.get("severity")),
        title=title,
        headline=title,
        description=description,
        lat=_float(raw.get("latitude")),
        lng=_float(raw.get("longitude")),
        starts_at=_parse_datetime(raw.get("event_date") or raw.get("created_at")),
        areas=location,
        event=alert_type.replace("_", " ").title(),
        provider_alert_id=provider_id,
        country_iso=country_iso or None,
        metadata_json={
            "external_id": raw.get("external_id"),
            "polygon": raw.get("polygon"),
            "provider_severity": raw.get("severity"),
        },
    )


def map_travelrisk_report(
    country_payload: dict[str, Any],
    score_payload: dict[str, Any],
    alert_rows: list[dict[str, Any]],
) -> ProviderTravelRiskReport:
    country_iso = str(
        score_payload.get("iso_code") or country_payload.get("iso_code") or ""
    ).strip().upper()
    country_name = str(
        score_payload.get("name") or country_payload.get("name") or country_iso
    ).strip()
    if not country_iso or not country_name:
        raise TravelRiskUnavailable("TravelRiskAPI returned an invalid country response")
    try:
        risk_score = float(
            score_payload.get("risk_score", country_payload.get("risk_score", 0))
        )
    except (TypeError, ValueError) as exc:
        raise TravelRiskUnavailable("TravelRiskAPI returned an invalid risk score") from exc
    alerts = [map_travelrisk_alert(row, country_name) for row in alert_rows]
    mapped_alerts = [alert for alert in alerts if alert is not None]
    advisory_level = country_payload.get("advisory_level", score_payload.get("advisory_level"))
    try:
        advisory_level = int(advisory_level) if advisory_level is not None else None
    except (TypeError, ValueError):
        advisory_level = None
    return ProviderTravelRiskReport(
        country_iso=country_iso,
        country_name=country_name,
        risk_score=max(0.0, min(risk_score, 5.0)),
        advisory_level=advisory_level,
        advisory_description=country_payload.get("advisory_description"),
        advisory_date=_parse_datetime(country_payload.get("advisory_date")),
        last_updated=_parse_datetime(country_payload.get("last_updated")),
        active_alert_count=_int(score_payload.get("active_alerts"), len(mapped_alerts)),
        alerts=mapped_alerts,
        calculation=(
            dict(score_payload.get("calculation"))
            if isinstance(score_payload.get("calculation"), dict)
            else {}
        ),
    )


def _float(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value) if value is not None else default
    except (TypeError, ValueError):
        return default


class TravelRiskApiProvider:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.travel_risk_api_key
        self.base_url = (
            base_url or settings.travel_risk_base_url or TRAVEL_RISK_BASE_URL
        ).rstrip("/")
        self._client = client
        self._owns_client = client is None
        self.timeout_seconds = timeout_seconds or settings.external_request_timeout_seconds

    async def _request(self, client: httpx.AsyncClient, path: str, **params: Any) -> dict[str, Any]:
        try:
            response = await client.get(
                f"{self.base_url}{path}",
                params=params or None,
                headers={"X-API-Key": self.api_key, "Accept": "application/json"},
            )
        except httpx.HTTPError as exc:
            raise TravelRiskUnavailable("TravelRiskAPI is unavailable") from exc
        if response.status_code in {401, 403}:
            raise TravelRiskMissingKey("TRAVEL_RISK_API_KEY is invalid or missing")
        if response.status_code == 404:
            raise TravelRiskCountryNotFound("Travel risk country not found")
        if response.status_code == 429 or response.status_code >= 500:
            raise TravelRiskUnavailable("TravelRiskAPI is unavailable")
        try:
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise TravelRiskUnavailable("TravelRiskAPI returned an invalid response") from exc
        if not isinstance(payload, dict):
            raise TravelRiskUnavailable("TravelRiskAPI returned an invalid response")
        return payload

    async def country_report(self, country_iso: str) -> ProviderTravelRiskReport:
        if not self.api_key:
            raise TravelRiskMissingKey("TRAVEL_RISK_API_KEY is required")
        iso = str(country_iso or "").strip().upper()
        _, alpha3 = normalize_country_codes(iso)
        if alpha3 is not None:
            iso = alpha3
        if len(iso) != 3:
            raise TravelRiskCountryNotFound("A valid ISO alpha-3 country code is required")

        client = self._client or httpx.AsyncClient(timeout=self.timeout_seconds)
        try:
            country = await self._request(client, f"/countries/{iso}")
            score = await self._request(client, f"/risk-score/{iso}")
            alerts: list[dict[str, Any]] = []
            skip = 0
            limit = 100
            while True:
                page = await self._request(
                    client,
                    "/alerts",
                    country_iso=iso,
                    skip=skip,
                    limit=limit,
                )
                rows = page.get("data") or []
                if not isinstance(rows, list):
                    raise TravelRiskUnavailable("TravelRiskAPI returned invalid alerts")
                alerts.extend(row for row in rows if isinstance(row, dict))
                total = int(page.get("total") or len(alerts))
                if not rows or len(alerts) >= total:
                    break
                skip += len(rows)
            return map_travelrisk_report(country, score, alerts)
        finally:
            if self._owns_client:
                await client.aclose()

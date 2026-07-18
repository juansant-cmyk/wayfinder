from __future__ import annotations

from datetime import datetime
from typing import Any

import httpx

from app.core.config import settings
from app.providers.base import (
    ProviderAirQuality,
    ProviderCurrentWeather,
    ProviderForecastDay,
    ProviderForecastHour,
    ProviderSafetyAlert,
)

WEATHERAPI_BASE_URL = "https://api.weatherapi.com/v1"


class WeatherApiError(Exception):
    pass


class WeatherApiMissingKey(WeatherApiError):
    pass


class WeatherApiLocationNotFound(WeatherApiError):
    pass


class WeatherApiUnavailable(WeatherApiError):
    pass


def normalize_icon_url(icon: str | None) -> str | None:
    if not icon:
        return None
    if icon.startswith("//"):
        return f"https:{icon}"
    if icon.startswith("http://"):
        return icon.replace("http://", "https://", 1)
    return icon


def _float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _int(value: Any) -> int | None:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _severity(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    if normalized in {"extreme", "severe", "moderate", "minor"}:
        return normalized
    return normalized or "unknown"


def weatherapi_query(destination: str | None, lat: float | None, lng: float | None) -> str:
    if lat is not None and lng is not None:
        return f"{lat},{lng}"
    cleaned = " ".join(str(destination or "").split())
    if cleaned:
        return cleaned
    raise ValueError("destination or lat/lng is required")


def map_air_quality(raw: dict[str, Any] | None) -> ProviderAirQuality | None:
    if not raw:
        return None
    return ProviderAirQuality(
        co=_float(raw.get("co")),
        no2=_float(raw.get("no2")),
        o3=_float(raw.get("o3")),
        so2=_float(raw.get("so2")),
        pm2_5=_float(raw.get("pm2_5")),
        pm10=_float(raw.get("pm10")),
        us_epa_index=_int(raw.get("us-epa-index")),
        gb_defra_index=_int(raw.get("gb-defra-index")),
    )


def map_forecast_days(payload: dict[str, Any]) -> list[ProviderForecastDay]:
    rows = ((payload.get("forecast") or {}).get("forecastday") or [])
    days: list[ProviderForecastDay] = []
    for row in rows:
        day = row.get("day") or {}
        condition = day.get("condition") or {}
        days.append(
            ProviderForecastDay(
                date=str(row.get("date") or ""),
                max_temp_c=_float(day.get("maxtemp_c")),
                min_temp_c=_float(day.get("mintemp_c")),
                avg_temp_c=_float(day.get("avgtemp_c")),
                max_temp_f=_float(day.get("maxtemp_f")),
                min_temp_f=_float(day.get("mintemp_f")),
                avg_temp_f=_float(day.get("avgtemp_f")),
                condition=condition.get("text"),
                icon_url=normalize_icon_url(condition.get("icon")),
                chance_of_rain=_int(day.get("daily_chance_of_rain")),
                chance_of_snow=_int(day.get("daily_chance_of_snow")),
                uv=_float(day.get("uv")),
            )
        )
    return days


def map_forecast_hours(payload: dict[str, Any], *, limit: int = 12) -> list[ProviderForecastHour]:
    """Return the next ``limit`` hourly slots from today/tomorrow forecast rows."""
    rows = ((payload.get("forecast") or {}).get("forecastday") or [])
    localtime = str(((payload.get("location") or {}).get("localtime") or "")).strip()
    now = _parse_datetime(localtime.replace(" ", "T") if localtime else None)
    hours: list[ProviderForecastHour] = []
    for day in rows:
        for row in day.get("hour") or []:
            time_label = str(row.get("time") or "")
            slot = _parse_datetime(time_label.replace(" ", "T") if time_label else None)
            if now is not None and slot is not None and slot < now:
                continue
            condition = row.get("condition") or {}
            hours.append(
                ProviderForecastHour(
                    time=time_label,
                    temp_c=_float(row.get("temp_c")),
                    temp_f=_float(row.get("temp_f")),
                    condition=condition.get("text"),
                    icon_url=normalize_icon_url(condition.get("icon")),
                    wind_kph=_float(row.get("wind_kph")),
                    chance_of_rain=_int(row.get("chance_of_rain")),
                    is_day=bool(row.get("is_day")) if row.get("is_day") is not None else None,
                )
            )
            if len(hours) >= limit:
                return hours
    return hours


def map_alerts(payload: dict[str, Any], destination: str, lat: float | None, lng: float | None) -> list[ProviderSafetyAlert]:
    alerts = ((payload.get("alerts") or {}).get("alert") or [])
    mapped: list[ProviderSafetyAlert] = []
    for alert in alerts:
        headline = str(alert.get("headline") or alert.get("event") or "Weather alert")
        description = str(alert.get("desc") or alert.get("note") or headline)
        instruction = alert.get("instruction")
        if instruction:
            description = f"{description}\n\nInstruction: {instruction}"
        mapped.append(
            ProviderSafetyAlert(
                source="weatherapi",
                destination=destination,
                alert_type="weather",
                severity=_severity(alert.get("severity")),
                title=headline,
                description=description,
                lat=lat,
                lng=lng,
                starts_at=_parse_datetime(alert.get("effective")),
                ends_at=_parse_datetime(alert.get("expires")),
                headline=headline,
                urgency=alert.get("urgency"),
                areas=alert.get("areas"),
                event=alert.get("event"),
                instruction=instruction,
            )
        )
    return mapped


def map_current_weather(payload: dict[str, Any]) -> ProviderCurrentWeather:
    location = payload.get("location") or {}
    current = payload.get("current") or {}
    condition = current.get("condition") or {}
    destination = ", ".join(
        part for part in (location.get("name"), location.get("region"), location.get("country")) if part
    ) or "Selected location"
    lat = _float(location.get("lat"))
    lng = _float(location.get("lon"))
    forecast_days = map_forecast_days(payload)
    forecast_hours = map_forecast_hours(payload)
    first_day = ((payload.get("forecast") or {}).get("forecastday") or [{}])[0]
    astro = first_day.get("astro") or {}
    forecast_summary = f"{condition.get('text') or 'Current weather'}"
    if forecast_days:
        first = forecast_days[0]
        if first.max_temp_f is not None and first.min_temp_f is not None:
            forecast_summary = (
                f"{condition.get('text') or 'Current weather'} today, "
                f"high {first.max_temp_f:.0f}F / low {first.min_temp_f:.0f}F."
            )

    return ProviderCurrentWeather(
        destination=destination,
        temp_c=float(current.get("temp_c")),
        temp_f=float(current.get("temp_f")),
        condition=str(condition.get("text") or "Unknown"),
        humidity=int(current.get("humidity")),
        forecast_summary=forecast_summary,
        icon_url=normalize_icon_url(condition.get("icon")),
        is_day=bool(current.get("is_day")) if current.get("is_day") is not None else None,
        wind_mph=_float(current.get("wind_mph")),
        wind_kph=_float(current.get("wind_kph")),
        wind_dir=current.get("wind_dir"),
        gust_mph=_float(current.get("gust_mph")),
        pressure_mb=_float(current.get("pressure_mb")),
        precip_mm=_float(current.get("precip_mm")),
        feelslike_c=_float(current.get("feelslike_c")),
        feelslike_f=_float(current.get("feelslike_f")),
        uv=_float(current.get("uv")),
        visibility_miles=_float(current.get("vis_miles")),
        cloud=_int(current.get("cloud")),
        localtime=location.get("localtime"),
        sunrise=astro.get("sunrise"),
        sunset=astro.get("sunset"),
        provider="weatherapi",
        air_quality=map_air_quality(current.get("air_quality")),
        forecast_days=forecast_days,
        forecast_hours=forecast_hours,
        warnings=map_alerts(payload, destination, lat, lng),
    )


class WeatherApiProvider:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.weather_api_key
        self.base_url = (base_url or settings.weatherapi_base_url or WEATHERAPI_BASE_URL).rstrip("/")
        self._client = client
        self._owns_client = client is None
        self.timeout_seconds = (
            timeout_seconds if timeout_seconds is not None else settings.external_request_timeout_seconds
        )

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout_seconds)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def current_weather(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
    ) -> ProviderCurrentWeather:
        if not self.api_key:
            raise WeatherApiMissingKey("WEATHER_API_KEY is required")
        try:
            query = weatherapi_query(destination, lat, lng)
        except ValueError as exc:
            raise WeatherApiLocationNotFound("Weather location not found") from exc

        client = await self._get_client()
        try:
            response = await client.get(
                f"{self.base_url}/forecast.json",
                params={
                    "key": self.api_key,
                    "q": query,
                    "days": 7,
                    "aqi": "yes",
                    "alerts": "yes",
                },
            )
        except httpx.HTTPError as exc:
            raise WeatherApiUnavailable("Weather provider unavailable") from exc
        finally:
            await self.aclose()

        if response.status_code == 400:
            raise WeatherApiLocationNotFound("Weather location not found")
        if response.status_code in {401, 403}:
            raise WeatherApiMissingKey("WEATHER_API_KEY is invalid or missing")
        if response.status_code >= 500:
            raise WeatherApiUnavailable("Weather provider unavailable")
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise WeatherApiUnavailable("Weather provider unavailable") from exc

        try:
            return map_current_weather(response.json())
        except (KeyError, TypeError, ValueError) as exc:
            raise WeatherApiUnavailable("Weather provider returned an invalid response") from exc

    async def alerts(
        self, lat: float | None, lng: float | None, destination: str
    ) -> list[ProviderSafetyAlert]:
        report = await self.current_weather(destination, lat, lng)
        return report.warnings

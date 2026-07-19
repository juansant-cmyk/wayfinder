from fastapi import HTTPException, status

from app.core.config import settings
from app.providers.base import CurrentWeatherProvider, ProviderCurrentWeather
from app.providers.mock import MockWeatherProvider
from app.providers.weatherapi import (
    WeatherApiLocationNotFound,
    WeatherApiMissingKey,
    WeatherApiUnavailable,
)
from app.schemas.dashboard import WeatherResponse


def _air_quality_dict(report: ProviderCurrentWeather) -> dict | None:
    if report.air_quality is None:
        return None
    return {
        "co": report.air_quality.co,
        "no2": report.air_quality.no2,
        "o3": report.air_quality.o3,
        "so2": report.air_quality.so2,
        "pm2_5": report.air_quality.pm2_5,
        "pm10": report.air_quality.pm10,
        "us_epa_index": report.air_quality.us_epa_index,
        "gb_defra_index": report.air_quality.gb_defra_index,
    }


def _forecast_days(report: ProviderCurrentWeather) -> list[dict]:
    return [
        {
            "date": day.date,
            "max_temp_c": day.max_temp_c,
            "min_temp_c": day.min_temp_c,
            "avg_temp_c": day.avg_temp_c,
            "max_temp_f": day.max_temp_f,
            "min_temp_f": day.min_temp_f,
            "avg_temp_f": day.avg_temp_f,
            "condition": day.condition,
            "icon_url": day.icon_url,
            "chance_of_rain": day.chance_of_rain,
            "chance_of_snow": day.chance_of_snow,
            "uv": day.uv,
        }
        for day in report.forecast_days
    ]


def _forecast_hours(report: ProviderCurrentWeather) -> list[dict]:
    return [
        {
            "time": hour.time,
            "temp_c": hour.temp_c,
            "temp_f": hour.temp_f,
            "condition": hour.condition,
            "icon_url": hour.icon_url,
            "wind_kph": hour.wind_kph,
            "chance_of_rain": hour.chance_of_rain,
            "is_day": hour.is_day,
        }
        for hour in report.forecast_hours
    ]


def _warnings(report: ProviderCurrentWeather) -> list[dict]:
    return [
        {
            "source": warning.source,
            "destination": warning.destination,
            "alert_type": warning.alert_type,
            "severity": warning.severity,
            "title": warning.title,
            "description": warning.description,
            "lat": warning.lat,
            "lng": warning.lng,
            "starts_at": warning.starts_at.isoformat() if warning.starts_at else None,
            "ends_at": warning.ends_at.isoformat() if warning.ends_at else None,
            "headline": warning.headline,
            "urgency": warning.urgency,
            "areas": warning.areas,
            "event": warning.event,
            "effective": warning.starts_at.isoformat() if warning.starts_at else None,
            "expires": warning.ends_at.isoformat() if warning.ends_at else None,
            "desc": warning.description,
            "instruction": warning.instruction,
        }
        for warning in report.warnings
    ]


def weather_to_response(report: ProviderCurrentWeather) -> WeatherResponse:
    return WeatherResponse(
        destination=report.destination,
        temp_c=report.temp_c,
        temp_f=report.temp_f,
        condition=report.condition,
        humidity=report.humidity,
        forecast_summary=report.forecast_summary,
        icon_url=report.icon_url,
        is_day=report.is_day,
        wind_mph=report.wind_mph,
        wind_kph=report.wind_kph,
        wind_dir=report.wind_dir,
        gust_mph=report.gust_mph,
        pressure_mb=report.pressure_mb,
        precip_mm=report.precip_mm,
        feelslike_c=report.feelslike_c,
        feelslike_f=report.feelslike_f,
        uv=report.uv,
        visibility_miles=report.visibility_miles,
        cloud=report.cloud,
        localtime=report.localtime,
        sunrise=report.sunrise,
        sunset=report.sunset,
        provider=report.provider,
        air_quality=_air_quality_dict(report),
        forecast_days=_forecast_days(report),
        forecast_hours=_forecast_hours(report),
        warnings=_warnings(report),
    )


async def current_weather(
    provider: CurrentWeatherProvider,
    destination: str | None,
    lat: float | None,
    lng: float | None,
) -> WeatherResponse:
    if not destination and (lat is None or lng is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="destination or lat/lng is required",
        )

    try:
        report = await provider.current_weather(destination, lat, lng)
    except WeatherApiLocationNotFound as exc:
        raise HTTPException(status_code=404, detail="Weather location not found") from exc
    except WeatherApiMissingKey as exc:
        if not settings.use_mock_providers:
            raise HTTPException(
                status_code=503,
                detail="WEATHER_API_KEY is required for WeatherAPI",
            ) from exc
        report = await MockWeatherProvider().current_weather(destination, lat, lng)
    except WeatherApiUnavailable as exc:
        if not settings.use_mock_providers:
            raise HTTPException(status_code=502, detail="Weather provider unavailable") from exc
        report = await MockWeatherProvider().current_weather(destination, lat, lng)

    return weather_to_response(report)

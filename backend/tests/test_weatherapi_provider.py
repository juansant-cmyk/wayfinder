import httpx
import pytest

from app.providers.weatherapi import (
    WeatherApiLocationNotFound,
    WeatherApiMissingKey,
    WeatherApiProvider,
    map_current_weather,
    normalize_icon_url,
)

pytestmark = pytest.mark.unit


def weatherapi_payload() -> dict:
    return {
        "location": {
            "name": "Bali",
            "region": "",
            "country": "Indonesia",
            "lat": -8.34,
            "lon": 115.09,
            "localtime": "2026-07-15 12:30",
        },
        "current": {
            "temp_c": 28.2,
            "temp_f": 82.8,
            "is_day": 1,
            "condition": {
                "text": "Partly cloudy",
                "icon": "//cdn.weatherapi.com/weather/64x64/day/116.png",
            },
            "wind_mph": 7.2,
            "wind_kph": 11.5,
            "wind_dir": "SE",
            "pressure_mb": 1011.0,
            "precip_mm": 0.1,
            "humidity": 79,
            "cloud": 42,
            "feelslike_c": 31.0,
            "feelslike_f": 87.8,
            "vis_miles": 6.0,
            "uv": 8.0,
            "gust_mph": 12.4,
            "air_quality": {
                "co": 210.0,
                "no2": 2.1,
                "o3": 33.0,
                "so2": 1.4,
                "pm2_5": 7.5,
                "pm10": 12.8,
                "us-epa-index": 1,
                "gb-defra-index": 2,
            },
        },
        "forecast": {
            "forecastday": [
                {
                    "date": "2026-07-15",
                    "day": {
                        "maxtemp_c": 30.0,
                        "mintemp_c": 24.0,
                        "avgtemp_c": 27.0,
                        "maxtemp_f": 86.0,
                        "mintemp_f": 75.2,
                        "avgtemp_f": 80.6,
                        "daily_chance_of_rain": 65,
                        "daily_chance_of_snow": 0,
                        "uv": 8.0,
                        "condition": {
                            "text": "Patchy rain nearby",
                            "icon": "//cdn.weatherapi.com/weather/64x64/day/176.png",
                        },
                    },
                }
            ]
        },
        "alerts": {
            "alert": [
                {
                    "headline": "Heavy Rain Warning",
                    "severity": "Moderate",
                    "urgency": "Expected",
                    "areas": "Bali",
                    "event": "Heavy rain",
                    "effective": "2026-07-15T10:00:00+00:00",
                    "expires": "2026-07-16T10:00:00+00:00",
                    "desc": "Periods of heavy rain are expected.",
                    "instruction": "Avoid flooded roads.",
                }
            ]
        },
    }


def test_weatherapi_icon_url_is_https():
    assert normalize_icon_url("//cdn.weatherapi.com/icon.png") == "https://cdn.weatherapi.com/icon.png"
    assert normalize_icon_url("http://cdn.weatherapi.com/icon.png") == "https://cdn.weatherapi.com/icon.png"


def test_weatherapi_payload_maps_to_current_weather():
    report = map_current_weather(weatherapi_payload())

    assert report.destination == "Bali, Indonesia"
    assert report.provider == "weatherapi"
    assert report.icon_url == "https://cdn.weatherapi.com/weather/64x64/day/116.png"
    assert report.air_quality is not None
    assert report.air_quality.us_epa_index == 1
    assert len(report.forecast_days) == 1
    assert report.forecast_days[0].chance_of_rain == 65
    assert report.forecast_days[0].icon_url == "https://cdn.weatherapi.com/weather/64x64/day/176.png"
    assert len(report.warnings) == 1
    assert report.warnings[0].title == "Heavy Rain Warning"
    assert report.warnings[0].severity == "moderate"
    assert report.warnings[0].urgency == "Expected"
    assert report.warnings[0].areas == "Bali"
    assert report.warnings[0].event == "Heavy rain"
    assert "Avoid flooded roads." in report.warnings[0].description


def test_weatherapi_air_quality_can_be_absent():
    payload = weatherapi_payload()
    payload["current"].pop("air_quality")

    assert map_current_weather(payload).air_quality is None


@pytest.mark.asyncio
async def test_weatherapi_provider_calls_forecast_endpoint():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/forecast.json"
        assert request.url.params["q"] == "-8.34,115.09"
        assert request.url.params["days"] == "7"
        assert request.url.params["aqi"] == "yes"
        assert request.url.params["alerts"] == "yes"
        return httpx.Response(200, json=weatherapi_payload())

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = WeatherApiProvider(
        api_key="dummy-weatherapi-key",
        base_url="https://api.weatherapi.com/v1",
        client=client,
    )

    report = await provider.current_weather(None, -8.34, 115.09)

    assert report.destination == "Bali, Indonesia"
    assert report.warnings[0].source == "weatherapi"
    await client.aclose()


@pytest.mark.asyncio
async def test_weatherapi_provider_missing_key_errors_before_request():
    provider = WeatherApiProvider(api_key="")

    with pytest.raises(WeatherApiMissingKey):
        await provider.current_weather("Bali", None, None)


@pytest.mark.asyncio
async def test_weatherapi_provider_400_maps_to_location_not_found():
    client = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda request: httpx.Response(400, json={"error": {}}))
    )
    provider = WeatherApiProvider(api_key="dummy-weatherapi-key", client=client)

    with pytest.raises(WeatherApiLocationNotFound):
        await provider.current_weather("Nowhere", None, None)
    await client.aclose()

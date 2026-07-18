from app.core.config import settings
from app.providers.base import CurrentWeatherProvider, HotelProvider, PlacesProvider, WeatherProvider
from app.providers.liteapi import LiteApiHotelProvider
from app.providers.mock import MockHotelProvider, MockPlacesProvider, MockWeatherProvider
from app.providers.weatherapi import WeatherApiProvider


def get_places_provider() -> PlacesProvider:
    return MockPlacesProvider()


def get_hotel_provider() -> HotelProvider:
    """Resolve hotel adapter: mock (default) or LiteAPI when enabled."""
    if settings.use_mock_providers:
        return MockHotelProvider()

    choice = (settings.hotel_provider or "").strip().lower()
    if choice in ("", "liteapi") and settings.liteapi_api_key:
        return LiteApiHotelProvider()
    if choice == "liteapi":
        return LiteApiHotelProvider()
    return MockHotelProvider()


def get_weather_provider() -> WeatherProvider:
    choice = (settings.weather_provider or "").strip().lower()
    if choice == "weatherapi":
        return WeatherApiProvider()
    return MockWeatherProvider()


def get_current_weather_provider() -> CurrentWeatherProvider:
    choice = (settings.weather_provider or "").strip().lower()
    if choice == "weatherapi":
        return WeatherApiProvider()
    return MockWeatherProvider()

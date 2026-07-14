from app.core.config import settings
from app.providers.base import (
    FareProvider,
    HotelProvider,
    LLMProvider,
    PlacesProvider,
    TravelAdvisoryProvider,
    WeatherProvider,
)
from app.providers.liteapi import LiteApiHotelProvider
from app.providers.mock import (
    MockFareProvider,
    MockHotelProvider,
    MockLLMProvider,
    MockPlacesProvider,
    MockTravelAdvisoryProvider,
    MockWeatherProvider,
)


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
    return MockWeatherProvider()


def get_travel_advisory_provider() -> TravelAdvisoryProvider:
    return MockTravelAdvisoryProvider()


def get_fare_provider() -> FareProvider:
    return MockFareProvider()


def get_llm_provider() -> LLMProvider:
    return MockLLMProvider()

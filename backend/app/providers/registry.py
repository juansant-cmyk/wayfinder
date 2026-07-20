from app.core.config import settings
from app.providers.anthropic_chat import AnthropicNarratorProvider
from app.providers.base import (
    ChatProvider,
    CurrentWeatherProvider,
    HotelProvider,
    NarratorProvider,
    PlacesProvider,
    WeatherProvider,
)
from app.providers.liteapi import LiteApiHotelProvider
from app.providers.mock import (
    MockChatProvider,
    MockHotelProvider,
    MockNarratorProvider,
    MockPlacesProvider,
    MockWeatherProvider,
)
from app.providers.openai_chat import OpenAiChatProvider
from app.providers.base import (
    CurrentWeatherProvider,
    FareProvider,
    HotelProvider,
    LLMProvider,
    PlacesProvider,
    TravelAdvisoryProvider,
    TravelRiskProvider,
    WeatherProvider,
)
from app.providers.google_places import GooglePlacesProvider
from app.providers.liteapi import LiteApiHotelProvider
from app.providers.mock import (
    MockFareProvider,
    MockHotelProvider,
    MockLLMProvider,
    MockPlacesProvider,
    MockTravelAdvisoryProvider,
    MockWeatherProvider,
    NoopTravelAdvisoryProvider,
    MockTravelRiskProvider,
)
from app.providers.travelrisk import TravelRiskApiProvider
from app.providers.weatherapi import WeatherApiProvider


def get_places_provider() -> PlacesProvider:
    if (settings.places_provider or "").strip().lower() == "google":
        return GooglePlacesProvider()
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
    if settings.use_mock_providers:
        return MockWeatherProvider()
    return MockWeatherProvider()


def get_current_weather_provider() -> CurrentWeatherProvider:
    choice = (settings.weather_provider or "").strip().lower()
    if choice == "weatherapi":
        return WeatherApiProvider()
    if settings.use_mock_providers:
        return MockWeatherProvider()
    return MockWeatherProvider()


def get_chat_provider() -> ChatProvider:
    """Primary agent brain — OpenAI for tools/subagents; mock otherwise."""
    choice = (settings.chat_provider or "").strip().lower()
    if choice == "openai":
        return OpenAiChatProvider()
    return MockChatProvider()


def get_narrator_provider() -> NarratorProvider | None:
    """Optional prose layer. ``none`` skips narration polish."""
    choice = (settings.narrator_provider or "").strip().lower()
    if choice in ("", "none"):
        return None
    if choice == "anthropic":
        return AnthropicNarratorProvider()
    if choice == "openai":
        # Reuse OpenAI chat as a thin narrator when Sonnet is not configured.
        provider = OpenAiChatProvider()

        class _OpenAiNarrator:
            name = "openai"

            async def narrate(self, system: str, user: str) -> str:
                from app.providers.base import ChatMessage

                result = await provider.complete(
                    [
                        ChatMessage(role="system", content=system),
                        ChatMessage(role="user", content=user),
                    ]
                )
                return result.content

        return _OpenAiNarrator()
    if choice == "mock":
        return MockNarratorProvider()
    return None
def get_travel_advisory_provider() -> TravelAdvisoryProvider:
    if settings.use_mock_providers:
        return MockTravelAdvisoryProvider()
    return NoopTravelAdvisoryProvider()


def get_travel_risk_provider() -> TravelRiskProvider:
    if (settings.travel_risk_provider or "").strip().lower() == "travelrisk":
        return TravelRiskApiProvider()
    return MockTravelRiskProvider()


def get_fare_provider() -> FareProvider:
    return MockFareProvider()


def get_llm_provider() -> LLMProvider:
    return MockLLMProvider()

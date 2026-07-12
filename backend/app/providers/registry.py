from app.core.config import settings
from app.providers.base import HotelProvider, PlacesProvider
from app.providers.liteapi import LiteApiHotelProvider
from app.providers.mock import MockHotelProvider, MockPlacesProvider


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

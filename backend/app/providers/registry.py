from app.providers.base import HotelProvider, PlacesProvider
from app.providers.mock import MockHotelProvider, MockPlacesProvider


def get_places_provider() -> PlacesProvider:
    return MockPlacesProvider()


def get_hotel_provider() -> HotelProvider:
    return MockHotelProvider()

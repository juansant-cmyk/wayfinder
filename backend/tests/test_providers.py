import pytest

from app.providers.mock import MockHotelProvider, MockPlacesProvider


@pytest.mark.asyncio
async def test_mock_places_provider_returns_limited_places():
    provider = MockPlacesProvider()
    places = await provider.popular_places(40.0, -74.0, 5, "restaurant", 1)

    assert len(places) == 1
    assert places[0].provider == "mock"
    assert places[0].category == "restaurant"


@pytest.mark.asyncio
async def test_mock_hotel_provider_sorts_by_price():
    provider = MockHotelProvider()
    hotels = await provider.search_hotels("Paris", None, None, None, None, 2, "price")

    assert len(hotels) == 2
    assert hotels[0].nightly_rate <= hotels[1].nightly_rate
    assert "Wi-Fi" in hotels[0].amenities

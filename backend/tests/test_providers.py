import pytest

from app.providers.mock import MockHotelProvider, MockPlacesProvider
from app.services.hotel_sort import sort_provider_hotels

pytestmark = pytest.mark.unit


@pytest.mark.asyncio
async def test_mock_places_provider_returns_limited_places():
    provider = MockPlacesProvider()
    places = await provider.popular_places(40.0, -74.0, 5, "restaurant", 1)

    assert len(places) == 1
    assert places[0].provider == "mock"
    assert places[0].category == "restaurant"


@pytest.mark.asyncio
async def test_mock_hotel_provider_get_hotel_details():
    provider = MockHotelProvider()
    hotels = await provider.search_hotels("Bali", None, None, None, None, 1, "price")
    details = await provider.get_hotel_details(hotels[0].provider_hotel_id)

    assert details.provider == "mock"
    assert details.provider_hotel_id == hotels[0].provider_hotel_id
    assert details.name == hotels[0].name
    assert details.amenities


@pytest.mark.asyncio
async def test_mock_hotel_provider_get_hotel_details_unknown_id():
    provider = MockHotelProvider()
    with pytest.raises(LookupError):
        await provider.get_hotel_details("mock-hotel-does-not-exist-9")


@pytest.mark.asyncio
async def test_mock_hotel_provider_sorts_by_price():
    provider = MockHotelProvider()
    hotels = await provider.search_hotels("Paris", None, None, None, None, 2, "price")

    assert len(hotels) == 2
    assert hotels[0].nightly_rate <= hotels[1].nightly_rate
    assert "Wi-Fi included" in hotels[0].amenities


@pytest.mark.asyncio
async def test_mock_hotel_provider_sorts_by_rating():
    provider = MockHotelProvider()
    hotels = await provider.search_hotels("Paris", None, None, None, None, 2, "rating")

    assert len(hotels) == 2
    assert (hotels[0].rating or 0) >= (hotels[1].rating or 0)
    assert hotels[0].name.endswith("Garden Hotel")


@pytest.mark.asyncio
async def test_mock_hotel_provider_sorts_by_distance():
    from app.services.geo import haversine_km

    provider = MockHotelProvider()
    origin_lat, origin_lng = 40.7128, -74.006
    hotels = await provider.search_hotels(
        "Bali", origin_lat, origin_lng, None, None, 2, "distance"
    )

    assert len(hotels) == 2
    first = haversine_km(origin_lat, origin_lng, hotels[0].lat, hotels[0].lng)
    second = haversine_km(origin_lat, origin_lng, hotels[1].lat, hotels[1].lng)
    assert first <= second


@pytest.mark.asyncio
async def test_sort_provider_hotels_orders_by_haversine_distance():
    from app.providers.base import ProviderHotel
    from app.services.geo import haversine_km

    origin_lat, origin_lng = 40.7128, -74.006
    hotels = [
        ProviderHotel(
            provider="mock",
            provider_hotel_id="a",
            name="A",
            address=None,
            lat=-8.31,
            lng=115.12,
            nightly_rate=200.0,
            total_estimate=400.0,
            currency="USD",
            amenities=[],
            rating=4.5,
        ),
        ProviderHotel(
            provider="mock",
            provider_hotel_id="b",
            name="B",
            address=None,
            lat=-8.335,
            lng=115.097,
            nightly_rate=150.0,
            total_estimate=300.0,
            currency="USD",
            amenities=[],
            rating=4.5,
        ),
    ]

    sorted_hotels = sort_provider_hotels(hotels, "distance", origin_lat, origin_lng)
    first = haversine_km(origin_lat, origin_lng, sorted_hotels[0].lat, sorted_hotels[0].lng)
    second = haversine_km(origin_lat, origin_lng, sorted_hotels[1].lat, sorted_hotels[1].lng)
    assert first <= second


@pytest.mark.asyncio
async def test_sort_provider_hotels_uses_price_as_tiebreaker_for_rating():
    from app.providers.base import ProviderHotel

    hotels = [
        ProviderHotel(
            provider="mock",
            provider_hotel_id="a",
            name="A",
            address=None,
            lat=None,
            lng=None,
            nightly_rate=200.0,
            total_estimate=400.0,
            currency="USD",
            amenities=[],
            rating=4.5,
        ),
        ProviderHotel(
            provider="mock",
            provider_hotel_id="b",
            name="B",
            address=None,
            lat=None,
            lng=None,
            nightly_rate=150.0,
            total_estimate=300.0,
            currency="USD",
            amenities=[],
            rating=4.5,
        ),
    ]

    sorted_hotels = sort_provider_hotels(hotels, "rating")

    assert [hotel.name for hotel in sorted_hotels] == ["B", "A"]

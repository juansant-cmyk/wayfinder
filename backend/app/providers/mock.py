from app.providers.base import ProviderHotel, ProviderPlace
from app.services.hotel_sort import sort_provider_hotels

DEFAULT_CENTER_LAT = -8.3405
DEFAULT_CENTER_LNG = 115.092


class MockPlacesProvider:
    async def popular_places(
        self, lat: float, lng: float, radius_km: float, category: str | None, limit: int
    ) -> list[ProviderPlace]:
        places = [
            ProviderPlace(
                provider="mock",
                provider_place_id=f"mock-place-{category or 'popular'}-1",
                name="Central Market",
                category=category or "attraction",
                address="100 Market Street",
                lat=lat + 0.01,
                lng=lng + 0.01,
                rating=4.7,
                popularity_score=96,
                metadata_json={"radius_km": radius_km, "tags": ["food", "local"]},
            ),
            ProviderPlace(
                provider="mock",
                provider_place_id=f"mock-place-{category or 'popular'}-2",
                name="Riverfront Walk",
                category=category or "outdoors",
                address="Riverfront District",
                lat=lat - 0.01,
                lng=lng - 0.01,
                rating=4.5,
                popularity_score=88,
                metadata_json={"radius_km": radius_km, "tags": ["scenic", "free"]},
            ),
        ]
        return places[:limit]


class MockHotelProvider:
    async def search_hotels(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
        check_in: str | None,
        check_out: str | None,
        guests: int,
        sort: str,
    ) -> list[ProviderHotel]:
        location = destination or "Selected area"
        hotels = [
            ProviderHotel(
                provider="mock",
                provider_hotel_id=f"mock-hotel-{location.lower().replace(' ', '-')}-1",
                name=f"{location} Garden Hotel",
                address=f"12 Main Street, {location}",
                lat=DEFAULT_CENTER_LAT + 0.005,
                lng=DEFAULT_CENTER_LNG + 0.005,
                nightly_rate=149.0,
                total_estimate=298.0,
                currency="USD",
                amenities=["Wi-Fi", "Breakfast", "Pool"],
                rating=4.4,
                metadata_json={"guests": guests, "check_in": check_in, "check_out": check_out},
            ),
            ProviderHotel(
                provider="mock",
                provider_hotel_id=f"mock-hotel-{location.lower().replace(' ', '-')}-2",
                name=f"{location} Central Stay",
                address=f"45 Center Avenue, {location}",
                lat=DEFAULT_CENTER_LAT + 0.03,
                lng=DEFAULT_CENTER_LNG + 0.03,
                nightly_rate=119.0,
                total_estimate=238.0,
                currency="USD",
                amenities=["Wi-Fi", "Kitchenette"],
                rating=4.1,
                metadata_json={"guests": guests, "check_in": check_in, "check_out": check_out},
            ),
        ]
        return sort_provider_hotels(hotels, sort, lat, lng)

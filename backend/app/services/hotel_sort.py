from app.models.travel import Hotel
from app.providers.base import ProviderHotel
from app.services.geo import haversine_km


def _distance_key(
    origin_lat: float | None,
    origin_lng: float | None,
    lat: float | None,
    lng: float | None,
) -> float:
    if origin_lat is None or origin_lng is None or lat is None or lng is None:
        return float("inf")
    return haversine_km(origin_lat, origin_lng, lat, lng)


def sort_provider_hotels(
    hotels: list[ProviderHotel],
    sort: str,
    origin_lat: float | None = None,
    origin_lng: float | None = None,
) -> list[ProviderHotel]:
    if sort == "distance":
        return sorted(
            hotels,
            key=lambda hotel: (
                _distance_key(origin_lat, origin_lng, hotel.lat, hotel.lng),
                hotel.nightly_rate,
            ),
        )
    if sort == "rating":
        return sorted(
            hotels,
            key=lambda hotel: (-(hotel.rating or 0), hotel.nightly_rate),
        )
    return sorted(hotels, key=lambda hotel: hotel.nightly_rate)


def sort_hotels(
    hotels: list[Hotel],
    sort: str,
    origin_lat: float | None = None,
    origin_lng: float | None = None,
) -> list[Hotel]:
    if sort == "distance":
        return sorted(
            hotels,
            key=lambda hotel: (
                _distance_key(origin_lat, origin_lng, hotel.lat, hotel.lng),
                hotel.nightly_rate,
            ),
        )
    if sort == "rating":
        return sorted(
            hotels,
            key=lambda hotel: (-(hotel.rating or 0), hotel.nightly_rate),
        )
    return sorted(hotels, key=lambda hotel: hotel.nightly_rate)

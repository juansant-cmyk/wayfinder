from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class ProviderPlace:
    provider: str
    provider_place_id: str
    name: str
    category: str
    address: str | None
    lat: float
    lng: float
    rating: float | None
    popularity_score: float
    metadata_json: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ProviderHotel:
    provider: str
    provider_hotel_id: str
    name: str
    address: str | None
    lat: float | None
    lng: float | None
    nightly_rate: float
    total_estimate: float
    currency: str
    amenities: list[str]
    rating: float | None
    metadata_json: dict = field(default_factory=dict)


class PlacesProvider(Protocol):
    async def popular_places(
        self, lat: float, lng: float, radius_km: float, category: str | None, limit: int
    ) -> list[ProviderPlace]:
        ...


class HotelProvider(Protocol):
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
        ...

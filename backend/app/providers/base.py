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
    """External hotel source adapter.

    ``hotel_id`` on detail calls is the *provider* id (e.g. LiteAPI hotelId),
    not Wayfinder's internal UUID.
    """

    async def search_hotels(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
        check_in: str | None,
        check_out: str | None,
        guests: int,
        sort: str,
        guest_nationality: str | None = None,
        currency: str | None = None,
    ) -> list[ProviderHotel]:
        """Return ranked search hits for a destination or lat/lng pin.

        ``guest_nationality`` (ISO-3166-1 alpha-2) and ``currency`` (ISO-4217)
        are per-request market hints for live providers; mocks may ignore them.
        """
        ...

    async def get_hotel_details(self, hotel_id: str) -> ProviderHotel:
        """Return essential details for one hotel by provider hotel id.

        Includes identity, location, amenities, rating, and any content the
        vendor exposes (images/description live in ``metadata_json``).
        Live rates may be absent or zero when dates were not supplied; callers
        that need priced offers should use ``search_hotels`` (or a future
        rates method) with check-in/out.
        """
        ...

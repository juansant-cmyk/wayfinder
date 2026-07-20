from __future__ import annotations

import math
from typing import Any

import httpx

from app.core.config import settings
from app.providers.base import ProviderPlace

GOOGLE_PLACES_BASE_URL = "https://places.googleapis.com/v1"

CATEGORY_TYPES = {
    "restaurants": "restaurant",
    "restaurant": "restaurant",
    "attractions": "tourist_attraction",
    "attraction": "tourist_attraction",
    "shopping": "shopping_mall",
    "cafes": "cafe",
    "cafe": "cafe",
    "hotels": "lodging",
    "hotel": "lodging",
    "hospitals": "hospital",
    "hospital": "hospital",
    "pharmacies": "pharmacy",
    "pharmacy": "pharmacy",
    "transit-stations": "transit_station",
    "transit_station": "transit_station",
    "grocery-stores": "grocery_store",
    "grocery_store": "grocery_store",
    "atms": "atm",
    "atm": "atm",
}

FIELD_MASK = ",".join(
    (
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.rating",
        "places.userRatingCount",
        "places.primaryType",
        "places.primaryTypeDisplayName",
        "places.types",
        "places.regularOpeningHours.openNow",
        "places.photos.name",
        "places.googleMapsUri",
    )
)


class GooglePlacesError(Exception):
    pass


class GooglePlacesMissingKey(GooglePlacesError):
    pass


class GooglePlacesUnavailable(GooglePlacesError):
    pass


def category_to_google_type(category: str | None) -> str | None:
    if not category or category.strip().lower() in {"all", "more", "popular"}:
        return None
    normalized = category.strip().lower().replace(" ", "-")
    return CATEGORY_TYPES.get(normalized)


def _float(value: Any) -> float | None:
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def map_google_place(raw: dict[str, Any], requested_category: str | None) -> ProviderPlace | None:
    location = raw.get("location") or {}
    lat = _float(location.get("latitude"))
    lng = _float(location.get("longitude"))
    place_id = str(raw.get("id") or "").strip()
    name = str((raw.get("displayName") or {}).get("text") or "").strip()
    if not place_id or not name or lat is None or lng is None:
        return None

    rating = _float(raw.get("rating"))
    rating_count = int(raw.get("userRatingCount") or 0)
    popularity = min(100.0, (rating or 0) * 16 + math.log10(rating_count + 1) * 8)
    primary_type = str(raw.get("primaryType") or "").strip()
    category = primary_type or category_to_google_type(requested_category) or "place"
    photos = raw.get("photos") or []
    opening_hours = raw.get("regularOpeningHours") or {}
    return ProviderPlace(
        provider="google",
        provider_place_id=place_id,
        name=name,
        category=category,
        address=raw.get("formattedAddress"),
        lat=lat,
        lng=lng,
        rating=rating,
        popularity_score=round(popularity, 2),
        metadata_json={
            "types": raw.get("types") or [],
            "primary_type_label": (raw.get("primaryTypeDisplayName") or {}).get("text"),
            "rating_count": rating_count,
            "open_now": opening_hours.get("openNow"),
            "photo_reference": photos[0].get("name") if photos else None,
            "google_maps_uri": raw.get("googleMapsUri"),
        },
    )


class GooglePlacesProvider:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.google_maps_api_key
        self.base_url = (base_url or settings.google_places_base_url or GOOGLE_PLACES_BASE_URL).rstrip("/")
        self._client = client
        self._owns_client = client is None
        self.timeout_seconds = timeout_seconds or settings.external_request_timeout_seconds

    async def popular_places(
        self, lat: float, lng: float, radius_km: float, category: str | None, limit: int
    ) -> list[ProviderPlace]:
        if not self.api_key:
            raise GooglePlacesMissingKey("GOOGLE_MAPS_API_KEY is required")

        body: dict[str, Any] = {
            "maxResultCount": min(limit, 20),
            "rankPreference": "POPULARITY",
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": radius_km * 1000,
                }
            },
        }
        google_type = category_to_google_type(category)
        if google_type:
            body["includedTypes"] = [google_type]

        client = self._client or httpx.AsyncClient(timeout=self.timeout_seconds)
        try:
            response = await client.post(
                f"{self.base_url}/places:searchNearby",
                json=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": self.api_key,
                    "X-Goog-FieldMask": FIELD_MASK,
                },
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise GooglePlacesUnavailable("Places provider unavailable") from exc
        finally:
            if self._owns_client:
                await client.aclose()

        mapped = [map_google_place(row, category) for row in payload.get("places") or []]
        return [place for place in mapped if place is not None][:limit]

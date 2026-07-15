"""LiteAPI (Nuitee Connect) hotel adapter → ProviderHotel.

Docs: https://docs.liteapi.travel/
Auth header: X-API-Key
"""

from __future__ import annotations

import asyncio
from dataclasses import replace
from datetime import date, timedelta
from typing import Any

import httpx

from app.core.config import settings
from app.providers.base import ProviderHotel
from app.services.hotel_sort import sort_provider_hotels

LITEAPI_BASE = "https://api.liteapi.travel/v3.0"
DEFAULT_SEARCH_LIMIT = 20
DEFAULT_RADIUS_METERS = 8_000


def _default_stay_dates(
    check_in: str | None, check_out: str | None
) -> tuple[str, str]:
    if check_in and check_out:
        return check_in, check_out
    start = date.today() + timedelta(days=7)
    end = start + timedelta(days=1)
    return check_in or start.isoformat(), check_out or end.isoformat()


def _night_count(check_in: str, check_out: str) -> int:
    try:
        nights = (date.fromisoformat(check_out) - date.fromisoformat(check_in)).days
    except ValueError:
        return 1
    return max(nights, 1)


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _strip_html(text: str | None) -> str | None:
    if not text:
        return None
    cleaned = (
        text.replace("<br>", " ")
        .replace("<br/>", " ")
        .replace("<br />", " ")
        .replace("</p>", " ")
        .replace("<p>", "")
        .replace("<strong>", "")
        .replace("</strong>", "")
    )
    while "<" in cleaned and ">" in cleaned:
        start = cleaned.find("<")
        end = cleaned.find(">", start)
        if end == -1:
            break
        cleaned = cleaned[:start] + cleaned[end + 1 :]
    return " ".join(cleaned.split()) or None


def extract_offer_total(room_type: dict[str, Any]) -> tuple[float | None, str]:
    offer_rate = room_type.get("offerRetailRate") or {}
    amount = _parse_float(offer_rate.get("amount"))
    currency = offer_rate.get("currency") or "USD"
    if amount is not None:
        return amount, str(currency)

    rates = room_type.get("rates") or []
    if not rates:
        return None, str(currency)
    retail = rates[0].get("retailRate") or {}
    totals = retail.get("total") or []
    if not totals:
        return None, str(currency)
    amount = _parse_float(totals[0].get("amount"))
    currency = totals[0].get("currency") or currency
    return amount, str(currency)


def pick_cheapest_room_type(room_types: list[dict[str, Any]]) -> dict[str, Any] | None:
    priced: list[tuple[float, dict[str, Any]]] = []
    for room_type in room_types:
        total, _ = extract_offer_total(room_type)
        if total is None:
            continue
        priced.append((total, room_type))
    if not priced:
        return None
    priced.sort(key=lambda item: item[0])
    return priced[0][1]


# Card-first amenities — match flexible LiteAPI facility/tag strings.
FEATURED_AMENITY_ORDER = ("Pool", "Parking", "Gym", "Wi-Fi included")

FEATURED_AMENITY_MATCHERS: list[tuple[str, tuple[str, ...]]] = [
    ("Pool", ("swimming pool", "outdoor pool", "indoor pool", "rooftop pool")),
    ("Parking", ("parking", "car park", "garage")),
    ("Gym", ("gym", "fitness", "fitness centre", "fitness center", "fitness room", "fitness facilities")),
    ("Wi-Fi included", ("wifi", "wi-fi", "wireless", "internet")),
]


def _looks_like_pool(text: str) -> bool:
    low = text.lower()
    if "pool table" in low or "billiards" in low:
        return False
    if any(needle in low for needle in FEATURED_AMENITY_MATCHERS[0][1]):
        return True
    # Generic "pool" / "swim" without billiards false-positives.
    return "pool" in low or "swim" in low


def _facility_strings(info: dict[str, Any]) -> list[str]:
    values: list[str] = []
    for key in ("tags", "hotelFacilities", "hotel_facilities"):
        for item in info.get(key) or []:
            if isinstance(item, str) and item.strip():
                values.append(item.strip())
            elif isinstance(item, dict):
                name = item.get("name") or item.get("facility")
                if name:
                    values.append(str(name).strip())
    for item in info.get("facilities") or []:
        if isinstance(item, str) and item.strip():
            values.append(item.strip())
        elif isinstance(item, dict) and item.get("name"):
            values.append(str(item["name"]).strip())
    return values


def classify_facility_label(name: str) -> str | None:
    """Map a facility/tag string to a featured card label when relevant."""
    low = name.lower().strip()
    if not low:
        return None
    if _looks_like_pool(low):
        return "Pool"
    if "parking" in low:
        return "Parking"
    if any(needle in low for needle in FEATURED_AMENITY_MATCHERS[2][1]) or "fitness" in low:
        return "Gym"
    if any(needle in low for needle in FEATURED_AMENITY_MATCHERS[3][1]):
        return "Wi-Fi included"
    return None


def extract_featured_amenities(sources: list[str]) -> list[str]:
    """Return Pool / Parking / Gym / Wi-Fi included when any source string matches."""
    found: list[str] = []
    for src in sources:
        label = classify_facility_label(str(src))
        if label and label not in found:
            found.append(label)
    return [label for label in FEATURED_AMENITY_ORDER if label in found]


def featured_amenities_from_facility_ids(
    facility_ids: list[Any],
    id_to_label: dict[int, str],
) -> list[str]:
    found: set[str] = set()
    for raw in facility_ids:
        try:
            fid = int(raw)
        except (TypeError, ValueError):
            continue
        label = id_to_label.get(fid)
        if label:
            found.add(label)
    return [label for label in FEATURED_AMENITY_ORDER if label in found]


def extract_cancellation_label(room_type: dict[str, Any] | None) -> str | None:
    """Map LiteAPI refundableTag to a short card label when present."""
    if not room_type:
        return None
    rates = room_type.get("rates") or []
    if not rates:
        return None
    policies = rates[0].get("cancellationPolicies") or {}
    tag = str(policies.get("refundableTag") or "").upper()
    if tag in {"RFN", "REFUNDABLE"}:
        return "Free cancellation"
    if tag in {"NRFN", "NON_REFUNDABLE", "NON-REFUNDABLE"}:
        return "Non-refundable"
    return None


def build_card_amenities(
    *,
    info: dict[str, Any],
    room_type: dict[str, Any] | None,
    limit: int = 6,
) -> list[str]:
    """Prioritize featured amenities + cancellation, then board / other tags."""
    facility_sources = _facility_strings(info)
    amenities: list[str] = []

    precomputed = list(info.get("_featured_amenities") or [])
    for label in FEATURED_AMENITY_ORDER:
        if label in precomputed and label not in amenities:
            amenities.append(label)

    for label in extract_featured_amenities(facility_sources):
        if label not in amenities:
            amenities.append(label)

    cancellation = extract_cancellation_label(room_type)
    if cancellation and cancellation not in amenities:
        amenities.append(cancellation)

    board = None
    rates = (room_type or {}).get("rates") or []
    if rates:
        board = rates[0].get("boardName") or rates[0].get("name")
    if board:
        board_label = str(board).strip()
        if board_label and board_label not in amenities:
            amenities.append(board_label)

    for raw in facility_sources:
        label = str(raw).strip()
        if not label or label in amenities:
            continue
        if classify_facility_label(label):
            continue
        amenities.append(label)
        if len(amenities) >= limit:
            break

    return amenities[:limit]


def map_liteapi_search_hotel(
    rate_row: dict[str, Any],
    hotel_info: dict[str, Any] | None,
    *,
    nights: int,
) -> ProviderHotel | None:
    hotel_id = str(rate_row.get("hotelId") or (hotel_info or {}).get("id") or "")
    if not hotel_id:
        return None

    room_type = pick_cheapest_room_type(list(rate_row.get("roomTypes") or []))
    if room_type is None:
        return None

    total, currency = extract_offer_total(room_type)
    if total is None:
        return None

    info = hotel_info or {}
    name = str(info.get("name") or f"Hotel {hotel_id}")
    address = info.get("address")
    city = info.get("city_name") or info.get("city")
    if address and city and city not in str(address):
        address = f"{address}, {city}"
    elif not address and city:
        address = str(city)

    amenities = build_card_amenities(info=info, room_type=room_type)
    cancellation = extract_cancellation_label(room_type)

    image_url = info.get("main_photo") or info.get("thumbnail")
    nightly = total / max(nights, 1)

    return ProviderHotel(
        provider="liteapi",
        provider_hotel_id=hotel_id,
        name=name,
        address=address,
        lat=_parse_float(info.get("latitude")),
        lng=_parse_float(info.get("longitude")),
        nightly_rate=round(nightly, 2),
        total_estimate=round(total, 2),
        currency=currency,
        amenities=amenities,
        rating=_parse_float(info.get("rating") if info.get("rating") is not None else info.get("stars")),
        metadata_json={
            "offer_id": room_type.get("offerId"),
            "image_url": image_url,
            "thumbnail": info.get("thumbnail"),
            "stars": info.get("stars"),
            "review_count": info.get("review_count"),
            "story": info.get("story"),
            "cancellation": cancellation,
            "rates_included": True,
        },
    )


def map_liteapi_hotel_details(payload: dict[str, Any]) -> ProviderHotel:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    hotel_id = str(data.get("id") or data.get("hotelId") or "")
    if not hotel_id:
        raise LookupError("LiteAPI hotel details missing id")

    location = data.get("location") or {}
    images = data.get("hotelImages") or []
    image_url = data.get("main_photo")
    if not image_url and images:
        default = next((img for img in images if img.get("defaultImage")), None)
        image_url = (default or images[0]).get("url")

    address = data.get("address")
    city = data.get("city")
    country = data.get("country")
    parts = [part for part in (address, city, country) if part]
    full_address = ", ".join(str(part) for part in parts) if parts else None

    amenities = build_card_amenities(info=data if isinstance(data, dict) else {}, room_type=None, limit=8)
    if not amenities:
        raw_facilities = list(data.get("hotelFacilities") or data.get("facilities") or [])
        amenities = [
            str(item.get("name") if isinstance(item, dict) else item)
            for item in raw_facilities[:8]
            if item
        ]

    check_times = data.get("checkinCheckoutTimes") or {}
    check_in_time = check_times.get("checkin") or check_times.get("checkinStart")
    check_out_time = check_times.get("checkout")

    return ProviderHotel(
        provider="liteapi",
        provider_hotel_id=hotel_id,
        name=str(data.get("name") or hotel_id),
        address=full_address,
        lat=_parse_float(location.get("latitude") if location else data.get("latitude")),
        lng=_parse_float(location.get("longitude") if location else data.get("longitude")),
        nightly_rate=0.0,
        total_estimate=0.0,
        currency="USD",
        amenities=amenities,
        rating=_parse_float(data.get("rating") if data.get("rating") is not None else data.get("starRating")),
        metadata_json={
            "image_url": image_url,
            "images": [img.get("url") for img in images[:8] if img.get("url")],
            "description": _strip_html(data.get("hotelDescription")),
            "stars": data.get("starRating") or data.get("stars"),
            "rates_included": False,
            "check_in_time": check_in_time,
            "check_out_time": check_out_time,
        },
    )


class LiteApiHotelProvider:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        client: httpx.AsyncClient | None = None,
        timeout_seconds: float | None = None,
        guest_nationality: str | None = None,
        currency: str | None = None,
        search_limit: int = DEFAULT_SEARCH_LIMIT,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.liteapi_api_key
        self.base_url = (base_url or settings.liteapi_base_url or LITEAPI_BASE).rstrip("/")
        self._client = client
        self._owns_client = client is None
        self.timeout_seconds = (
            timeout_seconds
            if timeout_seconds is not None
            else max(float(settings.external_request_timeout_seconds), 30.0)
        )
        self.guest_nationality = (
            guest_nationality
            if guest_nationality is not None
            else (settings.liteapi_guest_nationality or "US")
        )
        self.currency = currency if currency is not None else (settings.liteapi_currency or "USD")
        self.search_limit = search_limit
        self._featured_facility_ids: dict[int, str] | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout_seconds)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _featured_facility_id_map(self) -> dict[int, str]:
        """Cache facility_id → featured card labels from LiteAPI catalog."""
        if self._featured_facility_ids is not None:
            return self._featured_facility_ids

        client = await self._get_client()
        response = await client.get(f"{self.base_url}/data/facilities", headers=self._headers())
        response.raise_for_status()
        rows = response.json().get("data") or []
        mapping: dict[int, str] = {}
        for row in rows:
            if not isinstance(row, dict):
                continue
            raw_id = row.get("facility_id", row.get("id", row.get("facilityId")))
            name = row.get("facility") or row.get("name") or ""
            label = classify_facility_label(str(name))
            if raw_id is None or label is None:
                continue
            try:
                mapping[int(raw_id)] = label
            except (TypeError, ValueError):
                continue
        self._featured_facility_ids = mapping
        return mapping

    async def _hotel_facility_ids(self, hotel_ids: list[str]) -> dict[str, list[int]]:
        """Batch-fetch facilityIds via /data/hotels (search payload lacks full facilities)."""
        unique_ids = [hotel_id for hotel_id in dict.fromkeys(hotel_ids) if hotel_id]
        if not unique_ids:
            return {}

        client = await self._get_client()
        result: dict[str, list[int]] = {}

        def _parse_ids(raw_ids: list[Any]) -> list[int]:
            parsed: list[int] = []
            for value in raw_ids:
                try:
                    parsed.append(int(value))
                except (TypeError, ValueError):
                    continue
            return parsed

        chunk_size = 20
        for start in range(0, len(unique_ids), chunk_size):
            chunk = unique_ids[start : start + chunk_size]
            response = await client.get(
                f"{self.base_url}/data/hotels",
                headers=self._headers(),
                params=[("hotelIds", hotel_id) for hotel_id in chunk],
            )
            if response.status_code >= 400:
                response = await client.get(
                    f"{self.base_url}/data/hotels",
                    headers=self._headers(),
                    params={"hotelIds": ",".join(chunk)},
                )
            if response.status_code >= 400:
                continue
            for row in response.json().get("data") or []:
                if not isinstance(row, dict) or row.get("id") is None:
                    continue
                result[str(row["id"])] = _parse_ids(list(row.get("facilityIds") or []))

        return result

    async def _featured_amenities_from_details(self, hotel_ids: list[str]) -> dict[str, list[str]]:
        """Fallback: read hotelFacilities from /data/hotel when batch facilityIds are missing."""
        if not hotel_ids:
            return {}

        client = await self._get_client()
        semaphore = asyncio.Semaphore(5)
        featured_by_hotel: dict[str, list[str]] = {}

        async def _load_one(hotel_id: str) -> None:
            async with semaphore:
                response = await client.get(
                    f"{self.base_url}/data/hotel",
                    headers=self._headers(),
                    params={"hotelId": hotel_id},
                )
                if response.status_code >= 400:
                    return
                data = response.json().get("data") or {}
                names = [str(item) for item in (data.get("hotelFacilities") or []) if item]
                for item in data.get("facilities") or []:
                    if isinstance(item, dict) and item.get("name"):
                        names.append(str(item["name"]))
                featured = extract_featured_amenities(names)
                if featured:
                    featured_by_hotel[hotel_id] = featured

        await asyncio.gather(*[_load_one(hotel_id) for hotel_id in hotel_ids])
        return featured_by_hotel

    def _headers(self) -> dict[str, str]:
        if not self.api_key:
            raise RuntimeError("LITEAPI_API_KEY is required")
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

    def _rates_body(
        self,
        *,
        destination: str | None,
        lat: float | None,
        lng: float | None,
        check_in: str,
        check_out: str,
        guests: int,
        guest_nationality: str | None = None,
        currency: str | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "checkin": check_in,
            "checkout": check_out,
            "currency": (currency or self.currency or "USD").upper(),
            "guestNationality": (guest_nationality or self.guest_nationality or "US").upper(),
            "occupancies": [{"adults": max(1, min(guests, 8))}],
            "maxRatesPerHotel": 1,
            "includeHotelData": True,
            "limit": self.search_limit,
            "roomMapping": True,
        }
        if lat is not None and lng is not None:
            body["latitude"] = lat
            body["longitude"] = lng
            body["radius"] = DEFAULT_RADIUS_METERS
        elif destination:
            # Natural-language destination works for Bali / city names without Place IDs.
            body["aiSearch"] = destination.strip()
        else:
            raise ValueError("destination or lat/lng is required for LiteAPI hotel search")
        return body

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
        check_in_date, check_out_date = _default_stay_dates(check_in, check_out)
        nights = _night_count(check_in_date, check_out_date)
        body = self._rates_body(
            destination=destination,
            lat=lat,
            lng=lng,
            check_in=check_in_date,
            check_out=check_out_date,
            guests=guests,
            guest_nationality=guest_nationality,
            currency=currency,
        )

        client = await self._get_client()
        response = await client.post(
            f"{self.base_url}/hotels/rates",
            headers=self._headers(),
            json=body,
        )
        response.raise_for_status()
        payload = response.json()

        rate_rows = list(payload.get("data") or [])
        hotel_rows = list(payload.get("hotels") or [])
        info_by_id = {
            str(item.get("id")): dict(item) for item in hotel_rows if item.get("id") is not None
        }

        hotel_ids = [str(row.get("hotelId") or "") for row in rate_rows if row.get("hotelId")]
        if hotel_ids:
            facility_ids_by_hotel = await self._hotel_facility_ids(hotel_ids)
            featured_id_map = await self._featured_facility_id_map() if facility_ids_by_hotel else {}

            for hotel_id, facility_ids in facility_ids_by_hotel.items():
                featured = featured_amenities_from_facility_ids(facility_ids, featured_id_map)
                if not featured:
                    continue
                info = info_by_id.get(hotel_id) or {"id": hotel_id}
                merged = {
                    *(info.get("_featured_amenities") or []),
                    *featured,
                }
                info["_featured_amenities"] = [
                    label for label in FEATURED_AMENITY_ORDER if label in merged
                ]
                info_by_id[hotel_id] = info

            # Hotels missing from batch (or with empty facilityIds) → details fallback.
            needs_details = [
                hotel_id
                for hotel_id in dict.fromkeys(hotel_ids)
                if hotel_id not in facility_ids_by_hotel or not facility_ids_by_hotel.get(hotel_id)
            ]
            if needs_details:
                featured_from_details = await self._featured_amenities_from_details(needs_details)
                for hotel_id, featured in featured_from_details.items():
                    info = info_by_id.get(hotel_id) or {"id": hotel_id}
                    merged = {
                        *(info.get("_featured_amenities") or []),
                        *featured,
                    }
                    info["_featured_amenities"] = [
                        label for label in FEATURED_AMENITY_ORDER if label in merged
                    ]
                    info_by_id[hotel_id] = info

        mapped: list[ProviderHotel] = []
        for row in rate_rows:
            hotel_id = str(row.get("hotelId") or "")
            provider_hotel = map_liteapi_search_hotel(
                row,
                info_by_id.get(hotel_id),
                nights=nights,
            )
            if provider_hotel is not None:
                mapped.append(
                    replace(
                        provider_hotel,
                        metadata_json={
                            **provider_hotel.metadata_json,
                            "check_in": check_in_date,
                            "check_out": check_out_date,
                        },
                    )
                )

        return sort_provider_hotels(mapped, sort, lat, lng)

    async def get_hotel_details(self, hotel_id: str) -> ProviderHotel:
        client = await self._get_client()
        response = await client.get(
            f"{self.base_url}/data/hotel",
            headers=self._headers(),
            params={"hotelId": hotel_id},
        )
        if response.status_code == 404:
            raise LookupError(f"LiteAPI hotel not found: {hotel_id}")
        response.raise_for_status()
        return map_liteapi_hotel_details(response.json())

"""LiteAPI (Nuitee Connect) hotel adapter → ProviderHotel.

Docs: https://docs.liteapi.travel/
Auth header: X-API-Key
"""

from __future__ import annotations

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

    amenities = list(info.get("tags") or [])[:8]
    board = None
    rates = room_type.get("rates") or []
    if rates:
        board = rates[0].get("boardName") or rates[0].get("name")
        if board and board not in amenities:
            amenities = [str(board), *amenities][:8]

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
            "rates_included": True,
        },
    )


def map_liteapi_hotel_details(payload: dict[str, Any]) -> ProviderHotel:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else payload
    hotel_id = str(data.get("id") or data.get("hotelId") or "")
    if not hotel_id:
        raise LookupError("LiteAPI hotel details missing id")

    location = data.get("location") or {}
    facilities = list(data.get("hotelFacilities") or data.get("facilities") or [])
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
        amenities=[str(item) for item in facilities[:12]],
        rating=_parse_float(data.get("rating") if data.get("rating") is not None else data.get("starRating")),
        metadata_json={
            "image_url": image_url,
            "images": [img.get("url") for img in images[:8] if img.get("url")],
            "description": _strip_html(data.get("hotelDescription")),
            "stars": data.get("starRating") or data.get("stars"),
            "rates_included": False,
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

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout_seconds)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

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
            str(item.get("id")): item for item in hotel_rows if item.get("id") is not None
        }

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

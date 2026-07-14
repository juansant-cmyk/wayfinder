"""Forward / reverse geocoding for hotel destination labels."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

NOMINATIM_UA = "WayfinderTravelApp/1.0 (local-dev)"


def _title_case(value: str) -> str:
    return " ".join(part.capitalize() for part in value.strip().split())


def _label_from_parts(city: str | None, region: str | None, country: str | None, fallback: str | None = None) -> str | None:
    if city and region and city.lower() != region.lower():
        return f"{city}, {region}"
    return city or region or country or fallback


def _google_components(components: list[dict[str, Any]]) -> dict[str, str]:
    mapped: dict[str, str] = {}
    for item in components:
        types = item.get("types") or []
        name = item.get("long_name")
        if not name:
            continue
        if "locality" in types:
            mapped["city"] = name
        elif "postal_town" in types and "city" not in mapped:
            mapped["city"] = name
        elif "administrative_area_level_1" in types:
            mapped["region"] = name
        elif "country" in types:
            mapped["country"] = name
    return mapped


async def _google_geocode(params: dict[str, Any]) -> dict[str, Any] | None:
    api_key = settings.google_maps_api_key
    if not api_key:
        return None
    query = {**params, "key": api_key}
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params=query,
        )
        response.raise_for_status()
        payload = response.json()
    if payload.get("status") != "OK":
        return None
    results = payload.get("results") or []
    if not results:
        return None
    hit = results[0]
    parts = _google_components(list(hit.get("address_components") or []))
    geometry = (hit.get("geometry") or {}).get("location") or {}
    label = _label_from_parts(
        parts.get("city"),
        parts.get("region"),
        parts.get("country"),
        hit.get("formatted_address"),
    )
    return {
        "label": label,
        "city": parts.get("city"),
        "region": parts.get("region"),
        "country": parts.get("country"),
        "lat": geometry.get("lat"),
        "lng": geometry.get("lng"),
        "provider": "google",
    }


async def _nominatim_reverse(lat: float, lng: float) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        response = await client.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"format": "json", "lat": lat, "lon": lng, "addressdetails": 1},
            headers={"User-Agent": NOMINATIM_UA, "Accept": "application/json"},
        )
        response.raise_for_status()
        payload = response.json()
    address = payload.get("address") or {}
    city = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or address.get("suburb")
    )
    region = address.get("state") or address.get("region")
    country = address.get("country")
    label = _label_from_parts(city, region, country, payload.get("display_name"))
    if not label:
        return None
    return {
        "label": label,
        "city": city,
        "region": region,
        "country": country,
        "lat": lat,
        "lng": lng,
        "provider": "nominatim",
    }


async def _nominatim_search(query: str) -> dict[str, Any] | None:
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        response = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"format": "json", "q": query, "addressdetails": 1, "limit": 1},
            headers={"User-Agent": NOMINATIM_UA, "Accept": "application/json"},
        )
        response.raise_for_status()
        results = response.json()
    if not results:
        return None
    hit = results[0]
    address = hit.get("address") or {}
    city = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or address.get("suburb")
    )
    region = address.get("state") or address.get("region")
    country = address.get("country")
    label = _label_from_parts(city, region, country, hit.get("display_name") or _title_case(query))
    return {
        "label": label or _title_case(query),
        "city": city,
        "region": region,
        "country": country,
        "lat": float(hit["lat"]),
        "lng": float(hit["lon"]),
        "provider": "nominatim",
    }


async def reverse_geocode(lat: float, lng: float) -> dict[str, Any] | None:
    try:
        google = await _google_geocode({"latlng": f"{lat},{lng}"})
        if google and google.get("label"):
            return google
    except httpx.HTTPError:
        pass
    try:
        return await _nominatim_reverse(lat, lng)
    except httpx.HTTPError:
        return None


async def search_geocode(query: str) -> dict[str, Any] | None:
    cleaned = " ".join(str(query or "").split())
    if not cleaned:
        return None
    try:
        google = await _google_geocode({"address": cleaned})
        if google and google.get("lat") is not None and google.get("lng") is not None:
            if not google.get("label"):
                google["label"] = _title_case(cleaned)
            return google
    except httpx.HTTPError:
        pass
    try:
        return await _nominatim_search(cleaned)
    except httpx.HTTPError:
        return None

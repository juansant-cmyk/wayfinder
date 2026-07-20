"""Forward / reverse geocoding for hotel destination labels."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings

NOMINATIM_UA = "WayfinderTravelApp/1.0 (local-dev; contact: wayfinder-dev@localhost)"
WIKIMEDIA_UA = (
    "WayfinderTravelApp/1.0 (https://github.com/local/wayfinder; wayfinder-dev@localhost)"
)


def _title_case(value: str) -> str:
    return " ".join(part.capitalize() for part in value.strip().split())


def _ascii_keywords(*parts: str | None) -> str:
    """Build Flickr-friendly ASCII keywords from geocode parts."""
    import re

    words: list[str] = []
    for part in parts:
        if not part:
            continue
        for token in re.findall(r"[A-Za-z]{2,}", part):
            lower = token.lower()
            if lower not in words:
                words.append(lower)
            if len(words) >= 3:
                return ",".join(words)
    return ",".join(words) if words else "travel,city"


def _flickr_cover_url(*parts: str | None) -> str:
    from hashlib import md5
    from urllib.parse import quote

    keywords = _ascii_keywords(*parts)
    seed = quote(keywords, safe=",")
    lock = int(md5(keywords.encode("utf-8")).hexdigest()[:8], 16) % 10_000
    return f"https://loremflickr.com/800/480/{seed}?lock={lock}"


def _label_from_parts(
    city: str | None, region: str | None, country: str | None, fallback: str | None = None
) -> str | None:
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
    query = {**params, "key": api_key, "language": "en"}
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


async def _nominatim_search(query: str, *, limit: int = 1) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        response = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "format": "json",
                "q": query,
                "addressdetails": 1,
                "limit": max(1, min(limit, 10)),
                "accept-language": "en",
            },
            headers={"User-Agent": NOMINATIM_UA, "Accept": "application/json"},
        )
        response.raise_for_status()
        results = response.json()
    mapped: list[dict[str, Any]] = []
    for hit in results or []:
        address = hit.get("address") or {}
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("municipality")
            or address.get("state")  # country-level / large admin
        )
        region = address.get("state") or address.get("region")
        country = address.get("country")
        # Require a city/town/region or country so free-text junk is filtered out.
        if not city and not country:
            continue
        label = _label_from_parts(
            city, region, country, hit.get("display_name") or _title_case(query)
        )
        if not label:
            continue
        try:
            lat = float(hit["lat"])
            lng = float(hit["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        mapped.append(
            {
                "label": label,
                "city": city,
                "region": region,
                "country": country,
                "lat": lat,
                "lng": lng,
                "provider": "nominatim",
            }
        )
    return mapped


async def _google_geocode_many(params: dict[str, Any], *, limit: int = 5) -> list[dict[str, Any]]:
    api_key = settings.google_maps_api_key
    if not api_key:
        return []
    query = {**params, "key": api_key, "language": "en"}
    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        response = await client.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params=query,
        )
        response.raise_for_status()
        payload = response.json()
    if payload.get("status") != "OK":
        return []
    mapped: list[dict[str, Any]] = []
    for hit in (payload.get("results") or [])[:limit]:
        types = set(hit.get("types") or [])
        # Keep locality / admin / country results — skip pure street addresses.
        if types and not types.intersection(
            {
                "locality",
                "postal_town",
                "administrative_area_level_1",
                "administrative_area_level_2",
                "country",
                "colloquial_area",
                "political",
            }
        ):
            continue
        parts = _google_components(list(hit.get("address_components") or []))
        if not parts.get("city") and not parts.get("country") and not parts.get("region"):
            continue
        geometry = (hit.get("geometry") or {}).get("location") or {}
        lat = geometry.get("lat")
        lng = geometry.get("lng")
        if lat is None or lng is None:
            continue
        label = _label_from_parts(
            parts.get("city"),
            parts.get("region"),
            parts.get("country"),
            hit.get("formatted_address"),
        )
        if not label:
            continue
        mapped.append(
            {
                "label": label,
                "city": parts.get("city"),
                "region": parts.get("region"),
                "country": parts.get("country"),
                "lat": float(lat),
                "lng": float(lng),
                "provider": "google",
            }
        )
    return mapped


def _dedupe_suggestions(items: list[dict[str, Any]], *, limit: int = 5) -> list[dict[str, Any]]:
    seen: set[str] = set()
    unique: list[dict[str, Any]] = []
    for item in items:
        key = str(item.get("label") or "").strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        unique.append(item)
        if len(unique) >= limit:
            break
    return unique


async def suggest_geocode(query: str, *, limit: int = 5) -> list[dict[str, Any]]:
    cleaned = " ".join(str(query or "").split())
    if len(cleaned) < 2:
        return []
    limit = max(1, min(limit, 5))
    results: list[dict[str, Any]] = []
    try:
        results.extend(await _google_geocode_many({"address": cleaned}, limit=limit))
    except httpx.HTTPError:
        pass
    if len(results) < limit:
        try:
            results.extend(await _nominatim_search(cleaned, limit=limit))
        except httpx.HTTPError:
            pass
    return _dedupe_suggestions(results, limit=limit)


async def destination_cover_image(
    *,
    label: str,
    city: str | None,
    country: str | None,
    lat: float,
    lng: float,
) -> str:
    """Pick a destination-correlated cover image.

    Prefer Wikipedia photo thumbnails when reachable; skip SVG flags.
    Otherwise Flickr photos tagged with English place keywords.
    """
    from urllib.parse import quote

    candidates: list[str] = []
    # City pages first — country pages often return flag SVGs.
    if city and country and any("a" <= ch.lower() <= "z" for ch in city):
        candidates.append(city)
        candidates.append(f"{city}, {country}")
    elif city and any("a" <= ch.lower() <= "z" for ch in city):
        candidates.append(city)
    if label and any("a" <= ch.lower() <= "z" for ch in label):
        candidates.append(label.split(",")[0].strip())
        candidates.append(label)

    seen: set[str] = set()
    ordered: list[str] = []
    for title in candidates:
        key = title.strip().lower()
        if not title or key in seen:
            continue
        seen.add(key)
        ordered.append(title)

    async with httpx.AsyncClient(timeout=settings.external_request_timeout_seconds) as client:
        for title in ordered:
            try:
                response = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}",
                    headers={
                        "User-Agent": WIKIMEDIA_UA,
                        "Accept": "application/json",
                    },
                    follow_redirects=True,
                )
                if response.status_code != 200:
                    continue
                payload = response.json()
                for key in ("thumbnail", "originalimage"):
                    source = (payload.get(key) or {}).get("source")
                    if not source:
                        continue
                    lower = str(source).lower()
                    # RN/web Image often can't render SVG flags.
                    if lower.endswith(".svg") or ".svg?" in lower:
                        continue
                    return str(source)
            except (httpx.HTTPError, ValueError, TypeError):
                continue

    return _flickr_cover_url(city, country, label)


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
        hits = await _nominatim_search(cleaned, limit=1)
        return hits[0] if hits else None
    except httpx.HTTPError:
        return None

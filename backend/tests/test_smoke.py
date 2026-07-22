"""Page-level API smoke tests — one flow per frontend screen.

Each test registers a user, obtains a Bearer token, and hits the endpoints
that screen calls. Minimal shape checks only; detailed behavior lives in
feature-specific test modules (e.g. test_auth.py for login edge cases).

Run: pytest -m smoke -v
"""

from datetime import date
from typing import Any

import pytest
from httpx import AsyncClient

from app.services import geocode as geocode_service

pytestmark = [pytest.mark.integration, pytest.mark.smoke]

# Shared query params used across multiple screens (Hotels, Weather, Safety).
BALI_DEST = "Bali"
BALI_LAT = -8.34
BALI_LNG = 115.09

_MOCK_GEO: dict[str, Any] = {
    "label": "Bali, Indonesia",
    "city": "Bali",
    "region": None,
    "country": "Indonesia",
    "country_code": "ID",
    "country_iso": "IDN",
    "lat": BALI_LAT,
    "lng": BALI_LNG,
    "provider": "mock",
}


@pytest.fixture(autouse=True)
def _stub_geocode(monkeypatch: pytest.MonkeyPatch):
    """Keep geo smoke tests offline — external Nominatim/Google are not required."""

    async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
        return {**_MOCK_GEO, "lat": lat, "lng": lng}

    async def search_geocode(query: str) -> dict[str, Any]:
        return {**_MOCK_GEO, "label": query}

    async def suggest_geocode(query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        return [{**_MOCK_GEO, "label": query}]

    monkeypatch.setattr(geocode_service, "reverse_geocode", reverse_geocode)
    monkeypatch.setattr(geocode_service, "search_geocode", search_geocode)
    monkeypatch.setattr(geocode_service, "suggest_geocode", suggest_geocode)


async def smoke_auth(client: AsyncClient, suffix: str = "smoke") -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"{suffix}@example.com",
            "password": "password123",
            "full_name": "Smoke Tester",
            "username": f"{suffix}user",
        },
    )
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_health_endpoints(client: AsyncClient):
    root = await client.get("/")
    assert root.status_code == 200
    assert root.json()["status"] == "ok"

    health = await client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"

    db = await client.get("/health/db")
    assert db.status_code == 200
    assert db.json()["database"] == "connected"


# ---------------------------------------------------------------------------
# Login / Signup (detailed cases in test_auth.py)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_login_flow(client: AsyncClient):
    """Register → login → /auth/me end-to-end (App.js session bootstrap)."""
    email = "smoke-login@example.com"
    password = "password123"

    registered = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": "Login Smoke",
            "username": "smokelogin",
        },
    )
    assert registered.status_code == 201
    assert registered.json()["access_token"]

    logged_in = await client.post(
        "/auth/login",
        json={"identity": email, "password": password},
    )
    assert logged_in.status_code == 200
    token = logged_in.json()["access_token"]

    me = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


# ---------------------------------------------------------------------------
# HomeScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_home_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-home")

    recommended = await client.get("/destinations/recommended", headers=headers)
    assert recommended.status_code == 200
    assert len(recommended.json()) >= 1

    travel_check = await client.get(
        f"/travel-check?destination={BALI_DEST}", headers=headers
    )
    assert travel_check.status_code == 200
    payload = travel_check.json()
    assert payload["summary"]
    assert payload["weather"]["temp_c"] is not None


# ---------------------------------------------------------------------------
# ItineraryScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_itinerary_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-itinerary")

    plans = await client.get("/plans", headers=headers)
    assert plans.status_code == 200
    assert isinstance(plans.json(), list)

    created = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Smoke Trip",
            "destination_name": "Bali, Indonesia",
            "start_date": date(2026, 8, 1).isoformat(),
            "end_date": date(2026, 8, 5).isoformat(),
        },
    )
    assert created.status_code == 201, created.text
    plan_id = created.json()["id"]

    detail = await client.get(f"/plans/{plan_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["title"] == "Smoke Trip"
    assert len(detail.json()["days"]) >= 1

    suggest = await client.get(
        "/geo/suggest", params={"q": "Bali", "limit": 5}, headers=headers
    )
    assert suggest.status_code == 200
    assert isinstance(suggest.json(), list)


# ---------------------------------------------------------------------------
# HotelsScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_hotels_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-hotels")

    hotels = await client.get(
        f"/hotels/search?destination={BALI_DEST}", headers=headers
    )
    assert hotels.status_code == 200
    assert len(hotels.json()) >= 1

    reverse = await client.get(
        "/geo/reverse",
        params={"lat": BALI_LAT, "lng": BALI_LNG},
        headers=headers,
    )
    assert reverse.status_code == 200
    assert reverse.json()["label"]

    search = await client.get(
        "/geo/search", params={"q": BALI_DEST}, headers=headers
    )
    assert search.status_code == 200
    assert search.json()["label"]


# ---------------------------------------------------------------------------
# FlightsScreen (DashboardFeatureScreen loader; FlightsScreen is UI-only)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_flights_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-flights")

    flights = await client.get(
        f"/flights/search?destination={BALI_DEST}", headers=headers
    )
    assert flights.status_code == 200
    assert len(flights.json()) >= 1
    assert flights.json()[0]["destination"] == BALI_DEST


# ---------------------------------------------------------------------------
# FavoritesScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_favorites_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-favorites")

    favorites = await client.get("/favorites", headers=headers)
    assert favorites.status_code == 200
    assert favorites.json() == []


# ---------------------------------------------------------------------------
# SafetyScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_safety_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-safety")

    report = await client.get(
        f"/safety/report?destination={BALI_DEST}&lat={BALI_LAT}&lng={BALI_LNG}",
        headers=headers,
    )
    assert report.status_code == 200
    payload = report.json()
    assert payload["location"]["label"]
    assert "risk" in payload

    reverse = await client.get(
        "/geo/reverse",
        params={"lat": BALI_LAT, "lng": BALI_LNG},
        headers=headers,
    )
    assert reverse.status_code == 200

    suggest = await client.get(
        "/geo/suggest", params={"q": "Tokyo", "limit": 5}, headers=headers
    )
    assert suggest.status_code == 200


# ---------------------------------------------------------------------------
# WeatherScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_weather_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-weather")

    weather = await client.get(
        f"/weather/current?destination={BALI_DEST}", headers=headers
    )
    assert weather.status_code == 200
    payload = weather.json()
    assert payload["temp_c"] is not None
    assert payload["icon_url"].startswith("https://")

    by_coords = await client.get(
        f"/weather/current?lat={BALI_LAT}&lng={BALI_LNG}", headers=headers
    )
    assert by_coords.status_code == 200

    suggest = await client.get(
        "/geo/suggest", params={"q": BALI_DEST, "limit": 5}, headers=headers
    )
    assert suggest.status_code == 200


# ---------------------------------------------------------------------------
# MapsScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_maps_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-maps")

    reverse = await client.get(
        "/geo/reverse",
        params={"lat": 40.0, "lng": -74.0},
        headers=headers,
    )
    assert reverse.status_code == 200
    assert reverse.json()["label"]


# ---------------------------------------------------------------------------
# AIChatScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_chat_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-chat")

    chat = await client.post(
        "/chat/messages",
        headers=headers,
        json={"message": "What should I pack for Bali?"},
    )
    assert chat.status_code == 200
    payload = chat.json()
    assert payload["reply"].strip()
    assert payload["provider"] == "mock"


# ---------------------------------------------------------------------------
# ProfileScreen (DashboardFeatureScreen)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_profile_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-profile")

    profile = await client.get("/auth/me", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["email"] == "smoke-profile@example.com"


# ---------------------------------------------------------------------------
# NotificationsScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_notifications_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-notifications")

    notifications = await client.get("/notifications", headers=headers)
    assert notifications.status_code == 200
    assert len(notifications.json()) >= 1


# ---------------------------------------------------------------------------
# DestinationScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_destination_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-destination")

    destination = await client.get("/destinations/bali", headers=headers)
    assert destination.status_code == 200
    assert destination.json()["name"] == "Bali"


# ---------------------------------------------------------------------------
# TravelCheckScreen
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_travel_check_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-travelcheck")

    travel_check = await client.get(
        f"/travel-check?destination={BALI_DEST}", headers=headers
    )
    assert travel_check.status_code == 200
    assert travel_check.json()["weather"]["icon_url"].startswith("https://")


# ---------------------------------------------------------------------------
# Auth gates — protected routes reject unauthenticated requests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_smoke_protected_routes_require_auth(client: AsyncClient):
    """Every screen endpoint must return 401 without a Bearer token."""
    protected = [
        ("GET", "/plans"),
        ("GET", f"/hotels/search?destination={BALI_DEST}"),
        ("GET", f"/flights/search?destination={BALI_DEST}"),
        ("GET", "/favorites"),
        ("GET", f"/safety/report?destination={BALI_DEST}"),
        ("GET", f"/weather/current?destination={BALI_DEST}"),
        ("GET", "/geo/reverse", {"lat": BALI_LAT, "lng": BALI_LNG}),
        ("GET", "/geo/search", {"q": BALI_DEST}),
        ("GET", "/geo/suggest", {"q": BALI_DEST}),
        ("GET", "/destinations/recommended"),
        ("GET", "/destinations/bali"),
        ("GET", f"/travel-check?destination={BALI_DEST}"),
        ("GET", "/notifications"),
        ("GET", "/auth/me"),
        ("GET", "/places/popular", {"lat": 40, "lng": -74}),
    ]

    for entry in protected:
        method, path = entry[0], entry[1]
        params = entry[2] if len(entry) > 2 else None
        response = await client.request(method, path, params=params)
        assert response.status_code == 401, f"{method} {path} should require auth"

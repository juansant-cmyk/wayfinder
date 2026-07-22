"""Shallow smoke tests — one happy path per frontend screen.

Checks connectivity only (HTTP status + minimal shape). Deep contract tests
live in test_api_schemas.py; behavioral edge cases in feature-specific modules.

Run: pytest -m smoke -v
"""

from datetime import date

import pytest
from httpx import AsyncClient

pytestmark = [pytest.mark.smoke, pytest.mark.usefixtures("stub_geocode")]

BALI_DEST = "Bali"
BALI_LAT = -8.34
BALI_LNG = 115.09


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


@pytest.mark.asyncio
async def test_smoke_health_endpoints(client: AsyncClient):
    assert (await client.get("/")).status_code == 200
    assert (await client.get("/health")).status_code == 200
    assert (await client.get("/health/db")).status_code == 200


@pytest.mark.asyncio
async def test_smoke_login_flow(client: AsyncClient):
    email = "smoke-login@example.com"
    password = "password123"
    assert (
        await client.post(
            "/auth/register",
            json={
                "email": email,
                "password": password,
                "full_name": "Login Smoke",
                "username": "smokelogin",
            },
        )
    ).status_code == 201
    login = await client.post("/auth/login", json={"identity": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]
    assert (await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})).status_code == 200


@pytest.mark.asyncio
async def test_smoke_home_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-home")
    assert (await client.get("/destinations/recommended", headers=headers)).status_code == 200
    assert (
        await client.get(f"/travel-check?destination={BALI_DEST}", headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_itinerary_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-itinerary")
    assert (await client.get("/plans", headers=headers)).status_code == 200
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
    assert created.status_code == 201
    plan_id = created.json()["id"]
    assert (await client.get(f"/plans/{plan_id}", headers=headers)).status_code == 200
    assert (
        await client.get("/geo/suggest", params={"q": "Bali", "limit": 5}, headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_hotels_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-hotels")
    assert (
        await client.get(f"/hotels/search?destination={BALI_DEST}", headers=headers)
    ).status_code == 200
    assert (
        await client.get(
            "/geo/reverse", params={"lat": BALI_LAT, "lng": BALI_LNG}, headers=headers
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_flights_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-flights")
    assert (
        await client.get(f"/flights/search?destination={BALI_DEST}", headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_favorites_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-favorites")
    assert (await client.get("/favorites", headers=headers)).status_code == 200


@pytest.mark.asyncio
async def test_smoke_safety_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-safety")
    assert (
        await client.get(
            f"/safety/report?destination={BALI_DEST}&lat={BALI_LAT}&lng={BALI_LNG}",
            headers=headers,
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_weather_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-weather")
    assert (
        await client.get(f"/weather/current?destination={BALI_DEST}", headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_maps_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-maps")
    assert (
        await client.get("/geo/reverse", params={"lat": 40.0, "lng": -74.0}, headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_chat_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-chat")
    assert (
        await client.post(
            "/chat/messages",
            headers=headers,
            json={"message": "What should I pack for Bali?"},
        )
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_profile_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-profile")
    assert (await client.get("/auth/me", headers=headers)).status_code == 200


@pytest.mark.asyncio
async def test_smoke_notifications_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-notifications")
    assert (await client.get("/notifications", headers=headers)).status_code == 200


@pytest.mark.asyncio
async def test_smoke_destination_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-destination")
    assert (await client.get("/destinations/bali", headers=headers)).status_code == 200


@pytest.mark.asyncio
async def test_smoke_travel_check_screen(client: AsyncClient):
    headers = await smoke_auth(client, "smoke-travelcheck")
    assert (
        await client.get(f"/travel-check?destination={BALI_DEST}", headers=headers)
    ).status_code == 200


@pytest.mark.asyncio
async def test_smoke_protected_routes_require_auth(client: AsyncClient):
    assert (await client.get("/plans")).status_code == 401
    assert (await client.get("/auth/me")).status_code == 401

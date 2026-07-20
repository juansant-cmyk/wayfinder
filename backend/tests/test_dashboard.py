import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


async def auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": "dashboard@example.com",
            "password": "password123",
            "full_name": "Dashboard User",
            "username": "dashboarduser",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_dashboard_endpoints_require_auth(client: AsyncClient):
    assert (await client.get("/favorites")).status_code == 401
    assert (await client.get("/flights/search")).status_code == 401
    assert (await client.get("/destinations/recommended")).status_code == 401


@pytest.mark.asyncio
async def test_quick_tools_endpoints(client: AsyncClient):
    headers = await auth_headers(client)

    plans = await client.get("/plans", headers=headers)
    assert plans.status_code == 200

    hotels = await client.get("/hotels/search?destination=Bali", headers=headers)
    assert hotels.status_code == 200
    assert len(hotels.json()) >= 1

    flights = await client.get("/flights/search?destination=Bali", headers=headers)
    assert flights.status_code == 200
    assert flights.json()[0]["destination"] == "Bali"

    favorites = await client.get("/favorites", headers=headers)
    assert favorites.status_code == 200
    assert favorites.json() == []

    safety = await client.get(
        "/safety/summary?destination=Bali&country_iso=IDN",
        headers=headers,
    )
    assert safety.status_code == 200
    assert safety.json()["destination"] == "Bali"

    weather = await client.get("/weather/current?destination=Bali", headers=headers)
    assert weather.status_code == 200
    weather_payload = weather.json()
    assert weather_payload["destination"] == "Bali"
    assert weather_payload["temp_c"] is not None
    assert weather_payload["icon_url"].startswith("https://")
    assert weather_payload["forecast_days"]
    assert "warnings" in weather_payload

    weather_by_coords = await client.get("/weather/current?lat=-8.34&lng=115.09", headers=headers)
    assert weather_by_coords.status_code == 200
    assert weather_by_coords.json()["destination"] == "-8.34,115.09"

    chat = await client.post(
        "/chat/messages",
        headers=headers,
        json={"message": "What should I do in Bali?"},
    )
    assert chat.status_code == 200
    chat_payload = chat.json()
    assert chat_payload["reply"].strip()
    assert chat_payload["provider"] == "mock"

    places = await client.get("/places/popular?lat=40&lng=-74&radius_km=5", headers=headers)
    assert places.status_code == 200


@pytest.mark.asyncio
async def test_home_screen_endpoints(client: AsyncClient):
    headers = await auth_headers(client)

    recommended = await client.get("/destinations/recommended", headers=headers)
    assert recommended.status_code == 200
    assert recommended.json()[0]["slug"] == "bali"

    destination = await client.get("/destinations/bali", headers=headers)
    assert destination.status_code == 200
    assert destination.json()["name"] == "Bali"

    travel_check = await client.get("/travel-check?destination=Bali", headers=headers)
    assert travel_check.status_code == 200
    assert travel_check.json()["summary"]
    assert travel_check.json()["weather"]["icon_url"].startswith("https://")

    notifications = await client.get("/notifications", headers=headers)
    assert notifications.status_code == 200
    assert len(notifications.json()) >= 1

    profile = await client.get("/auth/me", headers=headers)
    assert profile.status_code == 200

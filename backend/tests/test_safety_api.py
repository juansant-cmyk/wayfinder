import pytest
from httpx import AsyncClient

from app.providers.travelrisk import TravelRiskCountryNotFound

pytestmark = pytest.mark.integration


async def auth_headers(client: AsyncClient, prefix: str = "safety") -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"{prefix}@example.com",
            "password": "password123",
            "full_name": "Safety User",
            "username": f"{prefix}user",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_safety_feed_can_dismiss_alerts(client: AsyncClient):
    headers = await auth_headers(client, "safety")

    safety = await client.get(
        "/safety?destination=Lisbon&lat=38.7&lng=-9.1&country_iso=PRT",
        headers=headers,
    )
    assert safety.status_code == 200
    assert len(safety.json()) == 2

    alert_id = safety.json()[0]["id"]
    dismissed = await client.post(f"/safety/alerts/{alert_id}/dismiss", headers=headers)
    assert dismissed.status_code == 200
    assert dismissed.json()["status"] == "dismissed"

    after = await client.get(
        "/safety?destination=Lisbon&lat=38.7&lng=-9.1&country_iso=PRT",
        headers=headers,
    )
    assert after.status_code == 200
    assert len(after.json()) == 1


@pytest.mark.asyncio
async def test_safety_report_survives_missing_travelrisk_country(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """When TravelRisk lacks a country, the API still returns a complete report.

    Asserts response shape and risk bounds only — not is_stale, labels, or mock
    payload details, so minor fallback tweaks do not break this test.
    """
    headers = await auth_headers(client, "safetyfallback")

    class MissingCountryProvider:
        async def country_report(self, country_iso: str):
            raise TravelRiskCountryNotFound("country not in TravelRisk")

    monkeypatch.setattr(
        "app.providers.registry.get_travel_risk_provider",
        lambda: MissingCountryProvider(),
    )

    response = await client.get(
        "/safety/report?destination=United%20States",
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["coverage"]["country_iso"]
    assert payload["coverage"]["country_name"]
    assert payload["location"]["label"]
    assert 0 <= payload["risk"]["score"] <= 5
    assert payload["risk"]["level"] in {"low", "moderate", "high", "extreme"}
    assert isinstance(payload["is_stale"], bool)
    assert payload["sources"]
    assert payload["fetched_at"]


@pytest.mark.asyncio
async def test_safety_report_keeps_city_and_country_scope(client: AsyncClient):
    headers = await auth_headers(client, "safetyreport")

    response = await client.get(
        "/safety/report?destination=Tokyo%2C%20Japan&lat=35.68&lng=139.76&country_iso=JPN",
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["location"]["city"] == "Tokyo"
    assert payload["coverage"] == {
        "country_name": "Japan",
        "country_iso": "JPN",
        "granularity": "country",
    }
    assert payload["risk"]["score"] == 1.0
    assert payload["categories"][0]["title"] == "Country Advisory"

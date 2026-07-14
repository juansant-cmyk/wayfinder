import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


async def auth_headers(client: AsyncClient, prefix: str = "mvp") -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"{prefix}@example.com",
            "password": "password123",
            "full_name": "MVP User",
            "username": f"{prefix}user",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_chat_sessions_store_messages_and_use_saved_context(client: AsyncClient):
    headers = await auth_headers(client, "chat")

    await client.post(
        "/plans",
        json={"title": "Rome", "destination_name": "Rome", "radius_km": 5},
        headers=headers,
    )
    await client.post(
        "/favorites",
        json={
            "item_type": "place",
            "provider": "mock",
            "provider_item_id": "market-1",
            "snapshot": {"name": "Central Market", "subtitle": "Food"},
        },
        headers=headers,
    )

    session = await client.post("/chat/sessions", json={"title": "Ideas"}, headers=headers)
    assert session.status_code == 201
    session_id = session.json()["id"]

    turn = await client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": "What should I do?"},
        headers=headers,
    )
    assert turn.status_code == 201
    assert "saved favorites" in turn.json()["assistant_message"]["content"]
    assert "active travel plans" in turn.json()["assistant_message"]["content"]

    messages = await client.get(f"/chat/sessions/{session_id}/messages", headers=headers)
    assert messages.status_code == 200
    assert [message["role"] for message in messages.json()] == ["user", "assistant"]


@pytest.mark.asyncio
async def test_safety_feed_can_dismiss_alerts(client: AsyncClient):
    headers = await auth_headers(client, "safety")

    safety = await client.get("/safety?destination=Lisbon&lat=38.7&lng=-9.1", headers=headers)
    assert safety.status_code == 200
    assert len(safety.json()) == 2

    alert_id = safety.json()[0]["id"]
    dismissed = await client.post(f"/alerts/{alert_id}/dismiss", headers=headers)
    assert dismissed.status_code == 200
    assert dismissed.json()["status"] == "dismissed"

    after = await client.get("/safety?destination=Lisbon&lat=38.7&lng=-9.1", headers=headers)
    assert after.status_code == 200
    assert len(after.json()) == 1


@pytest.mark.asyncio
async def test_fare_watch_creates_initial_price_event(client: AsyncClient):
    headers = await auth_headers(client, "fare")

    watch = await client.post(
        "/fare-watches",
        json={
            "watch_type": "route",
            "origin": "SFO",
            "destination": "LIS",
            "target_price": 500,
        },
        headers=headers,
    )
    assert watch.status_code == 201
    watch_id = watch.json()["id"]

    events = await client.get(f"/fare-watches/{watch_id}/events", headers=headers)
    assert events.status_code == 200
    assert events.json()[0]["price"] == 180

    deleted = await client.delete(f"/fare-watches/{watch_id}", headers=headers)
    assert deleted.status_code == 204

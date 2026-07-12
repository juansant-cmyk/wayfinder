import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


async def auth_headers(client: AsyncClient, email_suffix: str = "fav") -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"{email_suffix}@example.com",
            "password": "password123",
            "full_name": "Favorites User",
            "username": f"{email_suffix}user",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def hotel_payload(**overrides):
    body = {
        "item_type": "hotel",
        "provider": "mock",
        "provider_item_id": "hotel-bali-1",
        "entity_id": "11111111-1111-1111-1111-111111111111",
        "snapshot": {
            "name": "Bali Garden Hotel",
            "price": 120,
            "currency": "USD",
            "rating": 4.5,
            "address": "Kuta, Bali",
            "image_url": "https://example.com/hotel.jpg",
            "subtitle": "Pool • Breakfast",
            "lat": -8.7,
            "lng": 115.2,
        },
    }
    body.update(overrides)
    return body


@pytest.mark.asyncio
async def test_favorites_require_auth(client: AsyncClient):
    assert (await client.get("/favorites")).status_code == 401
    assert (await client.post("/favorites", json=hotel_payload())).status_code == 401
    assert (
        await client.delete(
            "/favorites",
            params={
                "item_type": "hotel",
                "provider": "mock",
                "provider_item_id": "hotel-bali-1",
            },
        )
    ).status_code == 401


@pytest.mark.asyncio
async def test_favorite_hotel_upsert_list_and_delete(client: AsyncClient):
    headers = await auth_headers(client)

    empty = await client.get("/favorites", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == []

    created = await client.post("/favorites", json=hotel_payload(), headers=headers)
    assert created.status_code == 201
    data = created.json()
    assert data["item_type"] == "hotel"
    assert data["provider"] == "mock"
    assert data["provider_item_id"] == "hotel-bali-1"
    assert data["title"] == "Bali Garden Hotel"
    assert data["price"] == 120
    assert data["lat"] == -8.7
    assert data["snapshot"]["name"] == "Bali Garden Hotel"
    saved_at = data["saved_at"]

    listed = await client.get("/favorites", headers=headers)
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    # R1 upsert: refresh snapshot, keep first saved_at
    updated = await client.post(
        "/favorites",
        json=hotel_payload(
            snapshot={
                "name": "Bali Garden Hotel",
                "price": 145,
                "currency": "USD",
                "rating": 4.6,
                "address": "Kuta, Bali",
                "image_url": "https://example.com/hotel.jpg",
                "subtitle": "Pool • Breakfast",
                "lat": -8.7,
                "lng": 115.2,
            }
        ),
        headers=headers,
    )
    assert updated.status_code == 201
    assert updated.json()["price"] == 145
    assert updated.json()["saved_at"] == saved_at

    deleted = await client.delete(
        "/favorites",
        params={
            "item_type": "hotel",
            "provider": "mock",
            "provider_item_id": "hotel-bali-1",
        },
        headers=headers,
    )
    assert deleted.status_code == 204

    # D1: idempotent delete
    again = await client.delete(
        "/favorites",
        params={
            "item_type": "hotel",
            "provider": "mock",
            "provider_item_id": "hotel-bali-1",
        },
        headers=headers,
    )
    assert again.status_code == 204

    listed_after = await client.get("/favorites", headers=headers)
    assert listed_after.json() == []

from datetime import date, timedelta

import pytest


async def _auth_headers(client, suffix: str = "status") -> dict[str, str]:
    register = await client.post(
        "/auth/register",
        json={
            "email": f"{suffix}@wayfinder.dev",
            "password": "wayfinder1",
            "full_name": "Status Tester",
            "username": f"{suffix}_user",
        },
    )
    assert register.status_code == 201, register.text
    return {"Authorization": f"Bearer {register.json()['access_token']}"}


@pytest.mark.asyncio
async def test_create_plan_defaults_active(client):
    headers = await _auth_headers(client, "active_default")
    start = date.today() + timedelta(days=7)
    end = start + timedelta(days=3)
    response = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Soon Trip",
            "destination_name": "Los Angeles",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    plan = response.json()
    assert plan["status"] == "active"
    assert plan["completed_at"] is None


@pytest.mark.asyncio
async def test_manual_complete_and_reopen(client):
    headers = await _auth_headers(client, "manual_complete")
    start = date.today() + timedelta(days=10)
    end = start + timedelta(days=2)
    created = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Early End",
            "destination_name": "Tokyo",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    plan_id = created.json()["id"]

    completed = await client.patch(
        f"/plans/{plan_id}",
        headers=headers,
        json={"status": "completed"},
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["status"] == "completed"
    assert completed.json()["completed_at"] is not None

    active_only = await client.get("/plans", headers=headers, params={"status": "active"})
    assert active_only.status_code == 200
    assert all(item["id"] != plan_id for item in active_only.json())

    past = await client.get("/plans", headers=headers, params={"status": "completed"})
    assert any(item["id"] == plan_id for item in past.json())

    reopened = await client.patch(
        f"/plans/{plan_id}",
        headers=headers,
        json={"status": "active"},
    )
    assert reopened.status_code == 200, reopened.text
    assert reopened.json()["status"] == "active"
    assert reopened.json()["completed_at"] is None


@pytest.mark.asyncio
async def test_auto_complete_past_end_date(client):
    headers = await _auth_headers(client, "auto_complete")
    start = date.today() - timedelta(days=10)
    end = date.today() - timedelta(days=3)
    created = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Past Trip",
            "destination_name": "Paris",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    assert created.status_code == 201, created.text
    plan_id = created.json()["id"]

    listed = await client.get("/plans", headers=headers, params={"status": "completed"})
    assert listed.status_code == 200
    match = next(item for item in listed.json() if item["id"] == plan_id)
    assert match["status"] == "completed"


@pytest.mark.asyncio
async def test_reopen_past_trip_stays_active(client):
    headers = await _auth_headers(client, "reopen_past")
    start = date.today() - timedelta(days=10)
    end = date.today() - timedelta(days=3)
    created = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Reopen Me",
            "destination_name": "Rome",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    plan_id = created.json()["id"]
    await client.get("/plans", headers=headers)  # trigger auto-complete

    reopened = await client.patch(
        f"/plans/{plan_id}",
        headers=headers,
        json={"status": "active"},
    )
    assert reopened.json()["status"] == "active"

    listed = await client.get("/plans", headers=headers, params={"status": "active"})
    assert any(item["id"] == plan_id for item in listed.json())


@pytest.mark.asyncio
async def test_delete_plan_removes_favorite(client):
    headers = await _auth_headers(client, "delete_fav")
    start = date.today() + timedelta(days=5)
    end = start + timedelta(days=2)
    created = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Fav Trip",
            "destination_name": "Berlin",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    plan_id = created.json()["id"]

    fav = await client.post(
        "/favorites",
        headers=headers,
        json={
            "item_type": "plan",
            "provider": "wayfinder",
            "provider_item_id": plan_id,
            "entity_id": plan_id,
            "snapshot": {"name": "Fav Trip", "subtitle": "Soon"},
        },
    )
    assert fav.status_code == 201, fav.text

    deleted = await client.delete(f"/plans/{plan_id}", headers=headers)
    assert deleted.status_code == 204

    favorites = await client.get("/favorites", headers=headers)
    assert favorites.status_code == 200
    assert all(item["provider_item_id"] != plan_id for item in favorites.json())

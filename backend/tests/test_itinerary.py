from datetime import date, timedelta

import pytest


async def _auth_headers(client) -> dict[str, str]:
    register = await client.post(
        "/auth/register",
        json={
            "email": "itinerary@wayfinder.dev",
            "password": "wayfinder1",
            "full_name": "Itinerary Tester",
            "username": "itinerary_user",
        },
    )
    assert register.status_code == 201, register.text
    token = register.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_plan_seeds_days_and_hotel_bookends(client):
    headers = await _auth_headers(client)
    start = date(2026, 7, 12)
    end = date(2026, 7, 15)
    response = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "LA Weekend",
            "destination_name": "Los Angeles, California",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "hotel_name": "Hotel Figueroa",
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["nights"] == 3
    assert payload["day_count"] == 4
    assert len(payload["days"]) == 4

    first = payload["days"][0]["activities"]
    last = payload["days"][-1]["activities"]
    assert any(a["kind"] == "check_in" and "Hotel Figueroa" in a["title"] for a in first)
    assert any(a["kind"] == "check_out" and "Hotel Figueroa" in a["title"] for a in last)


@pytest.mark.asyncio
async def test_reject_trip_longer_than_14_days(client):
    headers = await _auth_headers(client)
    start = date(2026, 7, 1)
    end = start + timedelta(days=14)  # 15 inclusive days
    response = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Too Long",
            "destination_name": "Paris",
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_same_day_trip_has_both_bookends(client):
    headers = await _auth_headers(client)
    day = date(2026, 8, 1)
    response = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Day trip",
            "destination_name": "Santa Monica",
            "start_date": day.isoformat(),
            "end_date": day.isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["nights"] == 0
    assert payload["day_count"] == 1
    kinds = [a["kind"] for a in payload["days"][0]["activities"]]
    assert kinds.count("check_in") == 1
    assert kinds.count("check_out") == 1


@pytest.mark.asyncio
async def test_date_rebuild_keeps_overlapping_custom_activity(client):
    headers = await _auth_headers(client)
    create = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Keep stops",
            "destination_name": "Los Angeles",
            "start_date": "2026-07-12",
            "end_date": "2026-07-14",
            "hotel_name": "Ace Hotel",
        },
    )
    assert create.status_code == 201, create.text
    plan = create.json()
    day_id = plan["days"][1]["id"]

    added = await client.post(
        f"/plans/{plan['id']}/days/{day_id}/activities",
        headers=headers,
        json={
            "time_label": "1:00 PM",
            "title": "Lunch",
            "location": "Venice",
            "category": "food",
        },
    )
    assert added.status_code == 201, added.text

    patched = await client.patch(
        f"/plans/{plan['id']}",
        headers=headers,
        json={"start_date": "2026-07-13", "end_date": "2026-07-15"},
    )
    assert patched.status_code == 200, patched.text
    updated = patched.json()
    assert updated["day_count"] == 3
    kept = [
        activity
        for day in updated["days"]
        for activity in day["activities"]
        if activity["title"] == "Lunch"
    ]
    assert len(kept) == 1
    assert updated["days"][0]["day_date"] == "2026-07-13"


@pytest.mark.asyncio
async def test_cannot_delete_check_in_activity(client):
    headers = await _auth_headers(client)
    create = await client.post(
        "/plans",
        headers=headers,
        json={
            "title": "Bookends",
            "destination_name": "LA",
            "start_date": "2026-07-12",
            "end_date": "2026-07-13",
        },
    )
    plan = create.json()
    check_in = next(a for a in plan["days"][0]["activities"] if a["kind"] == "check_in")
    response = await client.delete(
        f"/plans/{plan['id']}/activities/{check_in['id']}",
        headers=headers,
    )
    assert response.status_code == 400

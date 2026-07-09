# Integration tests for /auth — register, login, and me endpoints (US-01).
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.integration


def register_payload(**overrides):
    payload = {
        "email": "traveler@example.com",
        "password": "password123",
        "full_name": "Traveler Example",
        "username": "traveler",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_register_returns_token_and_user(client: AsyncClient):
    response = await client.post("/auth/register", json=register_payload())
    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["user"]["email"] == "traveler@example.com"
    assert data["user"]["full_name"] == "Traveler Example"
    assert data["user"]["username"] == "traveler"
    assert data["user"]["id"]


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client: AsyncClient):
    payload = register_payload(email="duplicate@example.com", username="duplicate1")
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post(
        "/auth/register",
        json=register_payload(email="duplicate@example.com", username="duplicate2"),
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_register_duplicate_username_returns_400(client: AsyncClient):
    first = await client.post(
        "/auth/register",
        json=register_payload(email="first@example.com", username="samehandle"),
    )
    assert first.status_code == 201

    second = await client.post(
        "/auth/register",
        json=register_payload(email="second@example.com", username="samehandle"),
    )
    assert second.status_code == 400
    assert second.json()["detail"] == "Username already taken"


@pytest.mark.asyncio
async def test_register_short_password_returns_422(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json=register_payload(password="short"),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_with_email_returns_token(client: AsyncClient):
    email = "login@example.com"
    password = "password123"
    await client.post(
        "/auth/register",
        json=register_payload(email=email, username="loginuser"),
    )

    response = await client.post(
        "/auth/login",
        json={"identity": email, "password": password},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == email


@pytest.mark.asyncio
async def test_login_with_username_returns_token(client: AsyncClient):
    email = "username-login@example.com"
    username = "wayfinderfan"
    password = "password123"
    await client.post(
        "/auth/register",
        json=register_payload(email=email, username=username),
    )

    response = await client.post(
        "/auth/login",
        json={"identity": username, "password": password},
    )
    assert response.status_code == 200
    assert response.json()["user"]["username"] == username


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client: AsyncClient):
    email = "wrongpass@example.com"
    await client.post(
        "/auth/register",
        json=register_payload(email=email, username="wrongpassuser"),
    )

    response = await client.post(
        "/auth/login",
        json={"identity": email, "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_unknown_account_returns_401(client: AsyncClient):
    response = await client.post(
        "/auth/login",
        json={"identity": "missing@example.com", "password": "password123"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_me_returns_current_user(client: AsyncClient):
    register = await client.post(
        "/auth/register",
        json=register_payload(email="me@example.com", username="meuser"),
    )
    token = register.json()["access_token"]

    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
    assert response.json()["full_name"] == "Traveler Example"


@pytest.mark.asyncio
async def test_me_without_token_returns_401(client: AsyncClient):
    response = await client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["detail"] == "Not authenticated"


@pytest.mark.asyncio
async def test_me_invalid_token_returns_401(client: AsyncClient):
    response = await client.get(
        "/auth/me",
        headers={"Authorization": "Bearer not-a-valid-token"},
    )
    assert response.status_code == 401

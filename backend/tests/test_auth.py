# Integration tests for /auth — register, login, and me endpoints (US-01).
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_returns_token_and_user(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "traveler@example.com", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["user"]["email"] == "traveler@example.com"
    assert data["user"]["id"]


@pytest.mark.asyncio
async def test_register_duplicate_email_returns_400(client: AsyncClient):
    payload = {"email": "duplicate@example.com", "password": "password123"}
    first = await client.post("/auth/register", json=payload)
    assert first.status_code == 201

    second = await client.post("/auth/register", json=payload)
    assert second.status_code == 400
    assert second.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_register_short_password_returns_422(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={"email": "short@example.com", "password": "short"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_returns_token(client: AsyncClient):
    email = "login@example.com"
    password = "password123"
    await client.post("/auth/register", json={"email": email, "password": password})

    response = await client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["user"]["email"] == email


@pytest.mark.asyncio
async def test_login_wrong_password_returns_401(client: AsyncClient):
    email = "wrongpass@example.com"
    await client.post(
        "/auth/register",
        json={"email": email, "password": "password123"},
    )

    response = await client.post(
        "/auth/login",
        json={"email": email, "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_me_returns_current_user(client: AsyncClient):
    register = await client.post(
        "/auth/register",
        json={"email": "me@example.com", "password": "password123"},
    )
    token = register.json()["access_token"]

    response = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


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

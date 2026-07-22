# Shared test fixtures — isolated async DB sessions and ASGI client for auth tests.
import os
from typing import Any

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.db.session import get_db
from app.main import app
from app.models import Base
from app.services import geocode as geocode_service

# Dedicated test DB so pytest TRUNCATE never wipes the local Expo login user.
# App .env typically uses `wayfinder` on the same host/port.
DEFAULT_TEST_DATABASE_URL = (
    "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder_test"
)

MOCK_GEO: dict[str, Any] = {
    "label": "Bali, Indonesia",
    "city": "Bali",
    "region": None,
    "country": "Indonesia",
    "country_code": "ID",
    "country_iso": "IDN",
    "lat": -8.34,
    "lng": 115.09,
    "provider": "mock",
}

test_settings = Settings(
    _env_file=None,
    database_url=os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL),
    jwt_secret=os.environ.get("JWT_SECRET", "ci-test-secret"),
)

test_engine = create_async_engine(
    test_settings.async_database_url(),
    poolclass=NullPool,
    connect_args=test_settings.database_connect_args(),
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


async def _ensure_test_database_exists() -> None:
    """Create wayfinder_test on the local Docker Postgres if missing."""
    admin_url = (
        os.environ.get("TEST_ADMIN_DATABASE_URL")
        or "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder"
    )
    target = test_settings.async_database_url().rsplit("/", 1)[-1]
    if not target or target == "wayfinder":
        return

    admin_engine = create_async_engine(admin_url, poolclass=NullPool)
    try:
        async with admin_engine.connect() as conn:
            conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
            exists = await conn.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": target},
            )
            if not exists:
                await conn.execute(text(f'CREATE DATABASE "{target}"'))
    finally:
        await admin_engine.dispose()


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def client(clean_tables):
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def create_schema():
    await _ensure_test_database_exists()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest.fixture
async def clean_tables(create_schema):
    async with TestSessionLocal() as session:
        await session.execute(
            text(
                "TRUNCATE TABLE users, travel_plans, plan_days, plan_activities, places, hotels, favorites, "
                "safety_alerts, alert_dismissals, safety_risk_snapshots CASCADE"
            )
        )
        await session.commit()
    yield


@pytest.fixture
def stub_geocode(monkeypatch: pytest.MonkeyPatch):
    """Offline geocode for tests that hit /geo or location-aware routes."""

    async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
        return {**MOCK_GEO, "lat": lat, "lng": lng}

    async def search_geocode(query: str) -> dict[str, Any]:
        return {**MOCK_GEO, "label": query}

    async def suggest_geocode(query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        return [{**MOCK_GEO, "label": query}]

    monkeypatch.setattr(geocode_service, "reverse_geocode", reverse_geocode)
    monkeypatch.setattr(geocode_service, "search_geocode", search_geocode)
    monkeypatch.setattr(geocode_service, "suggest_geocode", suggest_geocode)


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    response = await client.post(
        "/auth/register",
        json={
            "email": "integration@example.com",
            "password": "password123",
            "full_name": "Integration User",
            "username": "integrationuser",
        },
    )
    assert response.status_code == 201, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

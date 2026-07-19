# Shared test fixtures — isolated async DB sessions and ASGI client for auth tests.
import os

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import Settings
from app.db.session import get_db
from app.main import app
from app.models import Base

# Dedicated test DB so pytest TRUNCATE never wipes the local Expo login user.
# App .env typically uses `wayfinder` on the same host/port.
DEFAULT_TEST_DATABASE_URL = (
    "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder_test"
)

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
                "TRUNCATE TABLE users, travel_plans, places, hotels, favorites, "
                "chat_sessions, chat_messages, safety_alerts, alert_dismissals, "
                "fare_watches, fare_events CASCADE"
            )
        )
        await session.commit()
    yield

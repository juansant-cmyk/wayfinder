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

# Local Docker Postgres (database/docker-compose.yml maps 55432 -> 5432).
# Use TEST_DATABASE_URL to override (e.g. GitHub Actions). We intentionally do
# not read DATABASE_URL here — it often points at Supabase or the wrong port.
DEFAULT_TEST_DATABASE_URL = (
    "postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder"
)

test_settings = Settings(
    _env_file=None,
    database_url=os.environ.get("TEST_DATABASE_URL", DEFAULT_TEST_DATABASE_URL),
)

test_engine = create_async_engine(
    test_settings.async_database_url(),
    poolclass=NullPool,
    connect_args=test_settings.database_connect_args(),
)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


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

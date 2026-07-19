"""Security helpers: JWT secret boot policy and auth on /geo."""

import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from app.core.config import FORBIDDEN_JWT_SECRETS, JWT_SECRET_HELP, Settings


@pytest.mark.unit
def test_settings_rejects_default_jwt_secret():
    with pytest.raises(ValidationError) as exc_info:
        Settings(_env_file=None, jwt_secret="change-me-in-production")
    assert "JWT_SECRET" in str(exc_info.value)
    assert "change-me-in-production" in JWT_SECRET_HELP
    assert "change-me-in-production" in FORBIDDEN_JWT_SECRETS


@pytest.mark.unit
def test_settings_rejects_empty_jwt_secret():
    with pytest.raises(ValidationError):
        Settings(_env_file=None, jwt_secret="   ")


@pytest.mark.unit
def test_settings_accepts_non_default_jwt_secret():
    settings = Settings(_env_file=None, jwt_secret="ci-test-secret-not-default")
    assert settings.jwt_secret == "ci-test-secret-not-default"


@pytest.mark.asyncio
async def test_geo_reverse_requires_auth(client: AsyncClient):
    response = await client.get("/geo/reverse", params={"lat": 37.77, "lng": -122.42})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_geo_search_requires_auth(client: AsyncClient):
    response = await client.get("/geo/search", params={"q": "San Francisco"})
    assert response.status_code == 401

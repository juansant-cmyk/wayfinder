"""Ensure the local Expo test login exists (safe for local DB only)."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User

DEV_EMAIL = "test@wayfinder.dev"
DEV_PASSWORD = "wayfinder1"
DEV_FULL_NAME = "Test User"
DEV_USERNAME = "testuser"


async def ensure_dev_test_user(session: AsyncSession) -> str:
    """Create or refresh the standard local test user. Returns status message."""
    result = await session.execute(select(User).where(User.email == DEV_EMAIL))
    existing = result.scalar_one_or_none()

    if existing:
        existing.password_hash = hash_password(DEV_PASSWORD)
        existing.username = DEV_USERNAME
        existing.full_name = DEV_FULL_NAME
        await session.commit()
        return f"Refreshed local test user {DEV_EMAIL}"

    session.add(
        User(
            email=DEV_EMAIL,
            full_name=DEV_FULL_NAME,
            username=DEV_USERNAME,
            password_hash=hash_password(DEV_PASSWORD),
        )
    )
    await session.commit()
    return f"Created local test user {DEV_EMAIL}"

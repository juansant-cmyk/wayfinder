#!/usr/bin/env python3
"""Create the local dev test user if it does not exist yet."""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User

TEST_EMAIL = "test@wayfinder.dev"
TEST_PASSWORD = "wayfinder1"


async def main() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == TEST_EMAIL))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"Test user already exists: {TEST_EMAIL}")
            return

        user = User(email=TEST_EMAIL, password_hash=hash_password(TEST_PASSWORD))
        session.add(user)
        await session.commit()
        print("Created test user:")
        print(f"  email:    {TEST_EMAIL}")
        print(f"  password: {TEST_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())

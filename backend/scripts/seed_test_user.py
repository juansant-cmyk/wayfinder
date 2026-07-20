#!/usr/bin/env python3
"""Create or refresh the local dev test user."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import AsyncSessionLocal
from app.services.dev_seed import DEV_EMAIL, DEV_PASSWORD, DEV_USERNAME, ensure_dev_test_user


async def main() -> None:
    async with AsyncSessionLocal() as session:
        message = await ensure_dev_test_user(session)
    print(message)
    print(f"  email:    {DEV_EMAIL}")
    print(f"  username: {DEV_USERNAME}")
    print(f"  password: {DEV_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(main())

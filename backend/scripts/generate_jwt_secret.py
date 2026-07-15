#!/usr/bin/env python3
"""Print a strong JWT signing secret (does not write any files)."""

from __future__ import annotations

import secrets


def main() -> None:
    print(secrets.token_urlsafe(48))
    print(
        "\nCopy that value into backend/.env as JWT_SECRET=...",
        flush=True,
    )


if __name__ == "__main__":
    main()

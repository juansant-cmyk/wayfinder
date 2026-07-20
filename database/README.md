# Database

PostgreSQL + PostGIS schema, migrations, and seed data for Wayfinder.

## Team ownership

| Area | Sprint 1 focus |
|------|----------------|
| Core schema | Users, travel plans |
| PostGIS | Enable extension, geo column patterns |
| Migrations | Versioned schema changes |

## Stack

- PostgreSQL 15+
- PostGIS extension

## Layout

```
database/
├── docker-compose.yml   # Local Postgres + PostGIS
├── schema/              # Reference DDL (apply manually)
│   └── 001_users.sql
└── README.md
```

## Setup

Start Postgres + PostGIS:

```bash
cd database
docker compose up -d
```

Apply migrations (run after first `docker compose up`):

```bash
# Windows (PowerShell) — requires psql in PATH or use Docker exec:
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/001_users.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/002_travel_plans.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/003_places_hotels_bookmarks.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/004_user_profile.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/005_favorites.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/006_plan_itinerary.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/007_plan_status.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/008_plan_cover_image.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/009_safety_alerts_feed.sql

# macOS / Linux
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/001_users.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/002_travel_plans.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/003_places_hotels_bookmarks.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/004_user_profile.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/005_favorites.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/006_plan_itinerary.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/007_plan_status.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/008_plan_cover_image.sql
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/009_safety_alerts_feed.sql
```

Default connection (matches `backend/.env.example`):

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `55432` (host) → `5432` (container) |
| Database | `wayfinder` |
| User | `wayfinder` |
| Password | `wayfinder` |

Stop the database:

```bash
docker compose down
```

## Dev test user

After migrations, seed a shared login from the backend folder:

```bash
cd ../backend
python scripts/seed_test_user.py
```

| Email | Username | Password |
|-------|----------|----------|
| `test@wayfinder.dev` | `testuser` | `wayfinder1` |

## Related docs

- [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md)
- [../backend/README.md](../backend/README.md)

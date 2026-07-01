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

## Layout (planned)

```
database/
├── migrations/     # SQL or Alembic revisions
├── seeds/          # Dev/test data
├── schema/         # Reference DDL
└── docker-compose.yml   # Local Postgres + PostGIS (Sprint 1)
```

## Setup (Sprint 1)

Local database tooling will be added here.

## Related docs

- [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md)

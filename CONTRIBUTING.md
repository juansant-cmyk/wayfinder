# Contributing to Wayfinder

## Branch naming

```
feature/US-01-account-registration
fix/backend/hotel-price-sort
chore/frontend/expo-setup
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(mobile): add login screen
fix(server): validate email on register
docs: update sprint 2 backlog
```

## Pull requests

CI runs on every PR to `main`:

| Job | What it runs |
|-----|----------------|
| **Backend unit tests** | `ruff check` + `pytest -m unit` (mock providers, no DB) |
| **Backend integration tests** | `pytest -m integration` (auth + dashboard API against Postgres) |
| **Backend prod smoke** | `pip install -r requirements-prod.txt` + verify FastAPI app imports |
| **Database schema apply** | Apply `database/schema/*.sql` to fresh PostGIS Postgres |
| **Backend dependency audit** | `pip-audit` on prod requirements (advisory — does not block merge) |
| **Frontend lint** | `npm run lint` |
| **Frontend dependency audit** | `npm audit --audit-level=high` (advisory — does not block merge) |

Fix failing checks before merging.

1. Link the user story ID (e.g. US-02)
2. Fill out the PR template checklist
3. Request review from at least one teammate
4. Squash or merge per team preference — stay consistent

## Scrum cadence

| Ceremony | When |
|----------|------|
| Sprint planning | Day 1 of sprint |
| Daily standup | Daily, 15 min |
| Sprint review | Last day of sprint |
| Retrospective | After review |

## Local setup

See [README.md](README.md). Work in your team folder: `frontend/`, `backend/`, `database/`, or `design/`.

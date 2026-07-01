# Backend

Python FastAPI API for Wayfinder.

## Team ownership

| Area | Sprint 1 focus |
|------|----------------|
| Auth | Register, login, session (US-01) |
| API proxy | Google Maps, weather, advisory (Sprint 2+) |
| AI layer | OpenAI chat proxy (Sprint 3, US-05) |

## Stack

- Python 3.11+
- FastAPI
- Uvicorn
- PostgreSQL + SQLAlchemy (async)

## Setup

### 1. Start the database

See [../database/README.md](../database/README.md):

```bash
cd database
docker compose up -d
docker compose exec -T db psql -U wayfinder -d wayfinder < schema/001_users.sql
```

### 2. Configure and run the API

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env   # macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload
```

API: http://127.0.0.1:8000  
OpenAPI docs: http://127.0.0.1:8000/docs

### 3. Run tests

Requires the database container and `001_users.sql` migration applied:

```bash
cd backend
pytest
```

## Auth API (frontend contract)

All auth responses use JSON. Errors return `{ "detail": "..." }`.

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| `POST` | `/auth/register` | No | `{ "email", "password" }` | `201` — `{ "access_token", "token_type": "bearer", "user": { "id", "email", "created_at" } }` |
| `POST` | `/auth/login` | No | `{ "email", "password" }` | `200` — same shape as register |
| `GET` | `/auth/me` | `Authorization: Bearer <token>` | — | `200` — `{ "id", "email", "created_at" }` |

**Validation**

- Email must be a valid address (stored lowercase).
- Password minimum length: 8 characters.

**Frontend integration notes**

- Store `access_token` in Expo SecureStore after register/login.
- Gate `App.js`: unauthenticated → login/register stack; authenticated → tab navigator.
- Send `Authorization: Bearer <token>` on protected requests.
- On `401`, clear the token and return to login.
- Logout is client-only (delete token from SecureStore).

## Environment variables

See [.env.example](.env.example):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Async SQLAlchemy URL for PostgreSQL |
| `JWT_SECRET` | HS256 signing secret |
| `JWT_EXPIRE_HOURS` | Access token lifetime (default `24`) |
| `CORS_ORIGINS` | Comma-separated Expo dev origins |

## Related docs

- [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md)
- [../docs/SPRINT_PLAN.md](../docs/SPRINT_PLAN.md)
- [../database/README.md](../database/README.md)

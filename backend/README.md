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

### 4. Seed the dev test user (optional)

```bash
python scripts/seed_test_user.py
```

Local API startup also recreates this user automatically when `DATABASE_URL` points at localhost (so pytest no longer leaves you locked out). Pytest uses a separate DB (`wayfinder_test`) so truncate does not wipe `wayfinder`.

| Email | Password |
|-------|----------|
| `test@wayfinder.dev` | `wayfinder1` |

### 5. Run tests

**Unit** (no database):

```bash
cd backend
pytest -m unit
```

**Integration** (requires `docker compose up -d` in `database/`):

```bash
cd backend
pytest -m integration
```

Integration tests connect to local Docker Postgres on port **55432** by default (`wayfinder` / `wayfinder`). They ignore `DATABASE_URL` from `.env`. Override with `TEST_DATABASE_URL` if needed (CI uses port 5432).

If you see `InvalidPasswordError: password authentication failed for user "wayfinder"`:

1. Start the database: `cd database && docker compose up -d`
2. Ensure `.env` uses port **55432**, not 5432 (5432 is CI-only unless you run Postgres there)
3. Or override for one run: `TEST_DATABASE_URL=postgresql+asyncpg://wayfinder:wayfinder@localhost:55432/wayfinder pytest -m integration`

**All tests:**

```bash
pytest
```

Pull requests run unit, integration, lint, schema, and prod-smoke checks automatically via [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

## Auth API (frontend contract)

All auth responses use JSON. Errors return `{ "detail": "..." }`.

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| `POST` | `/auth/register` | No | `{ "email", "password", "full_name", "username" }` | `201` — `{ "access_token", "token_type": "bearer", "user": { "id", "email", "full_name", "username", "created_at" } }` |
| `POST` | `/auth/login` | No | `{ "identity", "password" }` | `200` — same shape as register |
| `GET` | `/auth/me` | `Authorization: Bearer <token>` | — | `200` — `{ "id", "email", "full_name", "username", "created_at" }` |

**Validation**

- Email must be a valid address (stored lowercase).
- Password minimum length: 8 characters.
- `full_name` is required (1–120 characters).
- `username` is required (3–40 characters, letters/numbers/underscore, stored lowercase, unique).
- Login `identity` accepts the account email or username. Only credentials stored in PostgreSQL succeed.

**Frontend integration notes**

- Store `access_token` in Expo SecureStore after register/login.
- Gate `App.js`: unauthenticated → login/register stack; authenticated → tab navigator.
- Send `Authorization: Bearer <token>` on protected requests.
- On `401`, clear the token and return to login.
- Logout is client-only (delete token from SecureStore).

## Dashboard API (HomeScreen buttons)

All routes below require `Authorization: Bearer <token>`. Mock data matches the current HomeScreen UI.

| HomeScreen control | Method | Path |
|--------------------|--------|------|
| **Itinerary** / **Trips** (nav) | `GET` | `/plans` |
| **Hotels** | `GET` | `/hotels/search?destination=Bali` |
| **Flights** | `GET` | `/flights/search?destination=Bali` |
| **Favorites** / **Saved** (nav) | `GET` | `/favorites` |
| | `POST` | `/favorites` (upsert heart) |
| | `DELETE` | `/favorites?item_type=&provider=&provider_item_id=` |
| **Safety** | `GET` | `/safety/summary?destination=Bali` |
| **Weather** | `GET` | `/weather/current?destination=Bali` |
| **AI Chat** / **Ask Wayfinder** | `POST` | `/chat/messages` `{ "message": "..." }` |
| **Maps** | `GET` | `/places/popular?lat=40&lng=-74&radius_km=5` |
| **Travel Check** card | `GET` | `/travel-check?destination=Bali` |
| **Recommended by Wayfinder** / **View all** | `GET` | `/destinations/recommended` |
| Destination card (e.g. Bali) | `GET` | `/destinations/bali` |
| **Notifications** (header) | `GET` | `/notifications` |
| **Profile** (header / nav) | `GET` | `/auth/me` |

## Sprint 1-2 API additions

Protected routes require `Authorization: Bearer <token>`.

| Area | Routes |
|------|--------|
| Travel plans | `GET/POST /plans`, `GET/PATCH/DELETE /plans/{plan_id}` |
| Plan itinerary | `POST /plans/{id}/days/{day_id}/activities`, `DELETE /plans/{id}/activities/{activity_id}` |
| Discovery | `GET /places/popular`, `GET /places/{place_id}` |
| Hotels | `GET /hotels/search`, `GET /hotels/{hotel_id}` |
| Flights | `GET /flights/search` |
| Favorites | `GET /favorites`, `POST /favorites`, `DELETE /favorites` |
| Safety | `GET /safety/summary` |
| Weather | `GET /weather/current` |
| Chat | `POST /chat/messages` |
| Destinations | `GET /destinations/recommended`, `GET /destinations/{slug}` |
| Notifications | `GET /notifications` |
| Travel check | `GET /travel-check` |

Places, hotels, flights, and dashboard feeds use deterministic mock data by default.

## Environment variables

See [.env.example](.env.example):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Async SQLAlchemy URL for PostgreSQL |
| `JWT_SECRET` | HS256 signing secret (required; refuses empty / `change-me-in-production`). Generate: `python scripts/generate_jwt_secret.py` |
| `JWT_EXPIRE_HOURS` | Access token lifetime (default `24`) |
| `CORS_ORIGINS` | Comma-separated Expo dev origins |
| `GOOGLE_MAPS_API_KEY` | Google Places key (maps / POI features) |
| `HOTEL_API_KEY` | Legacy unused key |
| `LITEAPI_API_KEY` | LiteAPI / Nuitee Connect API key |
| `LITEAPI_BASE_URL` | Default `https://api.liteapi.travel/v3.0` |
| `LITEAPI_GUEST_NATIONALITY` | ISO country for rate search (default `US`) |
| `LITEAPI_CURRENCY` | Rate currency (default `USD`) |
| `HOTEL_PROVIDER` | `mock` \| `liteapi` when mocks are off |
| `USE_MOCK_PROVIDERS` | `true` → mock hotels; `false` → LiteAPI when keyed |
| `EXTERNAL_REQUEST_TIMEOUT_SECONDS` | HTTP timeout (default `30` for hotel searches) |

## Related docs

- [../docs/DEPLOY.md](../docs/DEPLOY.md) — **Supabase + Render production deploy**
- [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md)
- [../docs/SPRINT_PLAN.md](../docs/SPRINT_PLAN.md)
- [../database/README.md](../database/README.md)

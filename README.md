# Wayfinder

Mobile travel app with AI integrations—easy to use, safe, and focused on the best deals.

## Problem

Travelers juggle maps, hotels, safety info, and budget tools in separate apps. Wayfinder unifies discovery, stays, personalization, and AI guidance in one dashboard.

## Project goals

- **Recommendations** — attractions, restaurants, hotels by preference and budget
- **Safety alerts** — weather, neighborhood risk, travel advisories (API-driven)
- **Worthiness ranking** — activity scores from user habits *(v1.1)*
- **AI itineraries** — full trip plans via LLM agents *(v1.1)*

Full overview: [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)

## Current status

**Shipped foundation (Sprint 1):** Expo app with auth, tab dashboard, and feature screens wired to the API. FastAPI backend with JWT auth, travel-plan CRUD, and dashboard routes backed by mock providers (`USE_MOCK_PROVIDERS=true` by default).

**Production:** API on [Render](docs/DEPLOY.md); database on [Supabase](docs/DEPLOY.md) (PostgreSQL + PostGIS).

**In progress / upcoming:** Live Google Maps, hotel, and weather providers (Sprint 2+); themes, bookmark CRUD, and bookmark-aware AI chat (Sprint 3); safety feeds and fare alerts (Sprint 4).

## Team directories

Each squad owns a top-level folder:

| Directory | Team | Stack |
|-----------|------|-------|
| [`frontend/`](frontend/) | Frontend | React Native (Expo) |
| [`backend/`](backend/) | Backend | Python, FastAPI |
| [`database/`](database/) | Database | PostgreSQL + PostGIS |
| [`design/`](design/) | Design | Wireframes, themes, assets |

Product docs live in [`docs/`](docs/) (shared by all teams).

## Tech stack

| Layer | Choice |
|-------|--------|
| Mobile | React Native (Expo) → `frontend/` |
| API | Python + FastAPI → `backend/` |
| Database | PostgreSQL + PostGIS → `database/` (local Docker; Supabase in prod) |
| Hosting | Render (API) + Supabase (DB) — see [docs/DEPLOY.md](docs/DEPLOY.md) |
| External APIs | Google Maps, Weather, Travel Advisory, trip/hotel DBs *(mocked in dev)* |
| AI | OpenAI (or equivalent LLM) — chat proxy in backend |

## Repository structure

```
wayfinder/
├── frontend/             # Expo React Native app
├── backend/              # FastAPI services
├── database/             # Schema SQL, PostGIS, local Docker setup
├── design/               # Wireframes, themes, UI assets
├── docs/                 # Product & sprint documentation
├── .github/workflows/    # CI (lint, tests, schema apply)
└── README.md
```

## Backend API (summary)

Local: http://127.0.0.1:8000 — OpenAPI docs at `/docs`  
Production: https://wayfinder-e30f.onrender.com

Full request/response shapes: [backend/README.md](backend/README.md)

### Public

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Service identity |
| `GET` | `/health` | Liveness check (Render) |
| `GET` | `/health/db` | Database connectivity |
| `POST` | `/auth/register` | Create account (`email`, `password`, `full_name`, `username`) |
| `POST` | `/auth/login` | Login with `identity` (email or username) + `password` |

### Protected (`Authorization: Bearer <token>`)

| Area | Routes |
|------|--------|
| **Profile** | `GET /auth/me` |
| **Travel plans** | `GET/POST /plans`, `GET/PATCH/DELETE /plans/{plan_id}` |
| **Places** | `GET /places/popular`, `GET /places/{place_id}` |
| **Hotels** | `GET /hotels/search`, `GET /hotels/{hotel_id}` |
| **Flights** | `GET /flights/search` |
| **Destinations** | `GET /destinations/recommended`, `GET /destinations/{slug}` |
| **Favorites** | `GET /favorites` |
| **Safety** | `GET /safety/summary` |
| **Weather** | `GET /weather/current` |
| **Travel check** | `GET /travel-check` |
| **Notifications** | `GET /notifications` |
| **AI chat** | `POST /chat/messages` |

Dashboard feeds (places, hotels, flights, safety, weather, chat, etc.) return deterministic mock data until live provider keys are configured.

## MVP (Sprint 4 release)

1. Sign up and save travel plans  
2. Dashboard navigation  
3. Popular places within a radius  
4. Hotel price comparison + amenities  
5. Bookmarks, themes, AI chat (bookmark-aware)  
6. Safety updates + live fare alerts  

See [docs/USER_STORIES.md](docs/USER_STORIES.md) and [docs/SPRINT_PLAN.md](docs/SPRINT_PLAN.md).

## Sprint overview

| Sprint | Theme |
|--------|-------|
| 1 | Foundation — auth, dashboard, FastAPI + DB scaffold |
| 2 | Discover & stay — maps, places, hotels |
| 3 | Personalize & AI — themes, bookmarks, chat |
| 4 | Safety, fares, release |

## Getting started

```bash
git clone https://github.com/juansant-cmyk/wayfinder.git
cd wayfinder
```

Then open your team's folder:

- Frontend → [frontend/README.md](frontend/README.md)
- Backend → [backend/README.md](backend/README.md)
- Database → [database/README.md](database/README.md)
- Design → [design/README.md](design/README.md)

## CI

Pull requests to `main` run GitHub Actions: backend lint + unit/integration tests, SQL schema apply, prod dependency smoke test, and frontend lint. Details: [CONTRIBUTING.md](CONTRIBUTING.md).

## Scrum

- **Sprints:** 4 × 1 week → v1.0  
- **DoD:** [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)

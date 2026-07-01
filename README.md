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

## Team directories

Each squad owns a top-level folder:

| Directory | Team | Stack |
|-----------|------|-------|
| [`frontend/`](frontend/) | Frontend | React Native (Expo) |
| [`backend/`](backend/) | Backend | Python, FastAPI |
| [`database/`](database/) | Database | PostgreSQL + PostGIS |
| [`design/`](design/) | Design | Wireframes, themes, assets |

Product docs live in [`docs/`](docs/) (shared by all teams).

**PO / QA / Backend:** backlog ownership, quality gates, FastAPI MVP delivery.

## Tech stack

| Layer | Choice |
|-------|--------|
| Mobile | React Native (Expo) → `frontend/` |
| API | Python + FastAPI → `backend/` |
| Database | PostgreSQL + PostGIS → `database/` |
| External APIs | Google Maps, Weather, Travel Advisory, trip/hotel DBs |
| AI | OpenAI (or equivalent LLM) |
| Cloud | AWS / Azure / Firebase *(Sprint 1 decision)* |

## Repository structure

```
wayfinder/
├── frontend/             # Expo React Native app
├── backend/              # FastAPI services
├── database/             # Migrations, PostGIS, local DB setup
├── design/               # Wireframes, themes, UI assets
├── docs/                 # Product & sprint documentation
├── .github/
└── README.md
```

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

## Scrum

- **Sprints:** 4 × 2 weeks → v1.0  
- **DoD:** [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)

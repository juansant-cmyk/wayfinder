# Wayfinder — 4-Sprint Plan

**Total duration:** 4 sprints × 1 week = 4 weeks to v1.0  
**Methodology:** Scrum

---

## MVP boundary

**Dashboard Quick Tools (8 features):**

| Feature | Sprint | Notes |
|---------|--------|-------|
| Itinerary | 2 | Travel plan CRUD end-to-end (API stub from Sprint 1) |
| Hotels | 2 | Search, price sort, detail + amenities |
| Flights | 2 | Search and compare mock/live fares |
| Favorites | 2 | Bookmark/saved list CRUD |
| Safety | 2 | Destination safety summary + Travel Check card |
| Weather | 2 | Current conditions per destination |
| **Maps** | **3** | Google Maps / Places API via backend proxy |
| **AI Chat** | **3** | LLM API via backend webhook/proxy |

**Ship at end of Sprint 4:** A traveler can sign up, use a themed dashboard, complete all six Sprint 2 Quick Tools as MVP flows, discover places on a map, chat with AI (bookmark-aware), and receive fare/price alerts.

---

## Sprint 1 — Foundation & identity

**Goal:** Runnable repo, auth, and dashboard shell the team can build on.

| Story | Tasks |
|-------|-------|
| US-01 | Register, login, logout, session persistence |
| US-04 | Dashboard layout, tab navigation, empty states |
| — | Repo layout: `frontend/`, `backend/`, `database/`, `design/`, lint, `.env.example` |
| — | FastAPI scaffold + PostgreSQL/PostGIS local docker-compose |
| — | CI: lint, unit/integration tests, schema apply on PR |
| — | Travel plan data model + CRUD API |
| — | Supabase + Render deploy path documented |

**Sprint 1 deliverables**
- [x] Expo app boots on iOS simulator / Android emulator
- [x] API auth endpoints (register, login, me) with `full_name` + `username`
- [x] Dashboard with Quick Tool screens wired to mock-backed API routes
- [x] Travel plan CRUD (`/plans`) + backend test suite
- [ ] README setup steps verified by second dev

**Story points (suggested):** 10–14

---

## Sprint 2 — Quick Tools MVP

**Goal:** Ship MVP-quality flows for every Quick Tool **except Maps and AI Chat** — Itinerary, Hotels, Flights, Favorites, Safety, and Weather.

| Quick Tool | Story / API | Tasks |
|------------|-------------|-------|
| **Itinerary** | US-01 | Create/edit/delete plans from app; list on Itinerary screen; link plan to destination |
| **Hotels** | US-03, US-09 | Search by destination, price sort, hotel detail + amenities panel |
| **Flights** | US-08 (search) | Flight search by destination/dates; compare options; mock provider swap path |
| **Favorites** | US-10 (CRUD) | Save/remove favorites; Saved tab lists items; empty states |
| **Safety** | US-07 (summary) | Safety summary screen; Travel Check card on home shows score + alerts |
| **Weather** | US-07 (weather) | Current weather per destination; surface on Weather screen + Travel Check |

| — | Cross-cutting |
|----|----------------|
| — | Loading, error, and empty states on all six feature screens |
| — | Integration tests for new/changed routes |
| — | Keep `USE_MOCK_PROVIDERS=true` until live hotel/flight/weather keys are ready |

**Out of scope for Sprint 2:** Maps (Places API), AI Chat (LLM API) — screens may show “coming in Sprint 3” or read-only mock only.

**Sprint 2 deliverables**
- [ ] Itinerary: user can create and manage travel plans from the app
- [ ] Hotels: search, sort by price, view amenities on detail
- [ ] Flights: search results with comparable fares
- [ ] Favorites: add/remove items and view Saved list
- [ ] Safety: destination safety summary + Travel Check home widget
- [ ] Weather: current conditions for active or selected destination
- [ ] All six tools demo-ready on device/simulator with JWT auth

**Story points (suggested):** 18–24 *(dense sprint — PO may defer Flights polish or Favorites v2 to Sprint 3 if needed)*

---

## Sprint 3 — Maps & AI Chat (external APIs)

**Goal:** Wire the two deferred Quick Tools to external services through the backend — no direct API keys in the mobile app.

| Quick Tool | Story | Tasks |
|------------|-------|-------|
| **Maps** | US-02 | Google Maps / Places proxy; location + radius picker; places list; map pins |
| **AI Chat** | US-05, US-10 | LLM webhook/proxy endpoint; chat UI with session history; inject favorites into context |

| — | Backend integration |
|----|----------------------|
| — | `GOOGLE_MAPS_API_KEY` provider swap (replace mock Places) |
| — | OpenAI (or equivalent) chat proxy with rate limiting and timeout |
| — | Env vars documented; secrets only on Render, not in Expo bundle |
| — | Graceful fallback when external API unavailable |

**Sprint 3 deliverables**
- [ ] Maps: popular places within radius with list + map visualization
- [ ] AI Chat: live LLM responses for travel Q&A
- [ ] AI recommendations reference user favorites when relevant
- [ ] Ask Wayfinder hero prompt routes into chat or trip flow

**Story points (suggested):** 14–18

---

## Sprint 4 — Personalize, deals & release

**Goal:** Themes, live fare alerts, polish, and store-ready MVP.

| Story | Tasks |
|-------|-------|
| US-06 | Theme picker (3+ presets), persist preference, apply to dashboard |
| US-08 | Price watch model, polling/webhook, in-app badges for flights/hotels |
| US-07 | Notification prefs; dismiss/mute safety alerts per trip |
| — | Error handling and accessibility pass across all Quick Tools |
| — | E2E smoke tests, TestFlight / internal APK |
| — | Release notes, demo script, backlog for v1.1 |

**Sprint 4 deliverables**
- [ ] Dashboard themes working end-to-end
- [ ] Fare/price change alerts for watched routes or hotels
- [ ] Safety notification preferences
- [ ] All 10 user stories meet acceptance criteria
- [ ] Team demo + retrospective complete

**Story points (suggested):** 13–18

---

## Backlog mapping summary

| ID | Story | Sprint |
|----|-------|--------|
| US-01 | Create account / save plans | 1 (auth + API), 2 (Itinerary MVP) |
| US-04 | Intuitive dashboard | 1 |
| US-03 | Compare hotel prices | 2 (Hotels) |
| US-09 | Hotel amenities | 2 (Hotels) |
| US-08 | Live fare updates | 2 (Flights search), 4 (price watch/alerts) |
| US-10 | Bookmarks / favorites | 2 (Favorites CRUD), 3 (AI context) |
| US-07 | Safety + weather updates | 2 (Safety + Weather MVP), 4 (notifications) |
| US-02 | Popular places in radius | 3 (Maps) |
| US-05 | AI chat | 3 (AI Chat) |
| US-06 | Dashboard theme | 4 |

---

## Quick Tools → sprint map

| Quick Tool | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|------------|----------|----------|----------|----------|
| Itinerary | API stub + screen shell | **MVP** | — | Polish |
| Hotels | Mock screen | **MVP** | Live provider (optional) | Price watch |
| Flights | Mock screen | **MVP** | — | Live alerts |
| Favorites | Mock list | **MVP** | AI context | — |
| Safety | Mock summary | **MVP** | — | Notification prefs |
| Weather | Mock current | **MVP** | — | — |
| Maps | Placeholder | Out of scope | **Maps API** | — |
| AI Chat | Placeholder | Out of scope | **LLM API** | — |

---

## Risks & dependencies

| Risk | Mitigation |
|------|------------|
| **Sprint 2 is wide (6 tools)** | PO prioritizes Must stories; ship mock-backed MVP first, swap providers incrementally |
| **1-week sprint capacity** | Cut Flights comparison polish or defer theme to Sprint 4 if slipping |
| Hotel/flight/weather API cost or limits | Mock layer in dev; provider registry already in backend |
| AI latency / cost | Rate limits, token caps, cached fallbacks; webhook only on backend |
| Google Maps setup | Sprint 3 spike; PostGIS schema ready in `database/schema/` |
| Maps + AI blocked on API keys | Document keys in `.env.example`; team secures keys before Sprint 3 start |

---

## Team lanes per sprint

| Sprint | Frontend | Backend | Database | Design |
|--------|----------|---------|----------|--------|
| 1 | Expo shell, dashboard + Quick Tool shells | Auth, plan CRUD, mock dashboard routes | Users + plans schema, PostGIS | Dashboard wireframes, nav |
| 2 | Itinerary, Hotels, Flights, Favorites, Safety, Weather screens | Provider swap for hotels/flights/weather/safety; favorites CRUD | Favorites/bookmarks schema if missing | Feature screen states, Travel Check |
| 3 | Maps UI (pins, radius), Chat UI | Google Places proxy, LLM webhook/proxy | Places cache, optional chat session storage | Map pins, chat bubbles |
| 4 | Themes, alert badges, notifications UI | Fare polling/webhooks, notification prefs | Alert subscriptions schema | Theme presets, release polish |

---

## Post-MVP backlog (v1.1)

From project goals—not in Sprint 1–4 commitment:

- **Worthiness ranking** — score activities from user behavior / bookmarks
- **AI itinerary generation** — multi-day plan export from LLM agent (Ask Wayfinder hero)

---

## Sprint 1 spikes (timeboxed)

Fit these into Sprint 1 alongside core delivery; defer anything that slips.

1. **Google Maps / Places** — 2h spike, radius search POC *(feeds Sprint 3 Maps)*
2. **Weather + Travel Advisory APIs** — 2h spike, response shape doc *(feeds Sprint 2 Safety/Weather)*
3. **Trip / hotel database API** — 2h spike, pricing fields *(feeds Sprint 2 Hotels/Flights)*
4. **OpenAI** — 1h spike, system prompt + bookmark context draft *(feeds Sprint 3 AI Chat)*
5. **Cloud host** — done: Supabase (DB) + Render (API); see [DEPLOY.md](DEPLOY.md)

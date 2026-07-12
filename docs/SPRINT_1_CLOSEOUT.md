# Sprint 1 Closeout Checklist

**Sprint theme:** Foundation & identity — runnable repo, auth, dashboard shell  
**Target stories:** US-01, US-04  
**Use this list before marking Sprint 1 Done on the board.**

---

## Product deliverables

- [ ] Expo app boots on iOS simulator or Android emulator (`cd frontend && npx expo start`)
- [ ] Backend runs against local Postgres (`cd database && docker compose up -d`, then `uvicorn app.main:app --reload`)
- [ ] Dashboard home screen loads after login (or with `EXPO_PUBLIC_SKIP_AUTH=true` for UI-only dev)
- [ ] Each home quick-tool / nav item opens a feature screen (not a popup-only flow)
- [ ] PO has reviewed auth + dashboard on device or simulator

---

## US-01 — Create account / save plans

- [ ] User can register with email + password
- [ ] User can log in and log out
- [ ] Session persists across app restart (`SecureStore` + `GET /auth/me`)
- [ ] Invalid credentials show clear, field-level errors
- [ ] **Travel plans persist to the user's account** — user can create at least one plan from the app (not list-only)
- [ ] Itinerary screen shows saved plans from `GET /plans`
- [ ] (Stretch) OAuth — defer to backlog if not in scope

---

## US-04 — Intuitive dashboard

- [ ] Home dashboard has clear entry points: Explore/Maps, Hotels, Saved, AI Chat, Profile
- [ ] Bottom navigation works (Home, Itinerary, Saved, Trips, Profile)
- [ ] Consistent navigation pattern chosen and documented (custom routing **or** React Navigation tabs/stack)
- [ ] Loading and error states on feature screens (not silent failures)
- [ ] Layout verified on a common phone size (and Expo web if team uses it for demos)
- [ ] Empty states where data is missing (e.g. no plans, no favorites)

---

## Engineering — repo & infra

- [ ] Repo layout verified: `frontend/`, `backend/`, `database/`, `design/`, `docs/`
- [ ] `.env.example` files exist and match required variables (backend + frontend)
- [ ] Database migrations applied: `001_users.sql`, `002_travel_plans.sql`, `003_places_hotels_bookmarks.sql`
- [ ] Test user seed documented and working (`test@wayfinder.dev` / `wayfinder1`)
- [ ] **Second developer** followed README setup end-to-end without blockers (record name + date below)
- [ ] `.gitignore` excludes `__pycache__/`, `.env`, `node_modules/`, `.expo/`

---

## Engineering — backend

- [ ] `POST /auth/register`, `POST /auth/login`, `GET /auth/me` behave per [backend/README.md](../backend/README.md)
- [ ] Travel plan CRUD stub: `GET/POST/PATCH/DELETE /plans` (backend)
- [ ] Dashboard routes require JWT (`Authorization: Bearer <token>`)
- [ ] `pytest` passes locally (`cd backend && pytest`) — currently 13 tests
- [ ] OpenAPI docs reachable at `/docs`

---

## Engineering — frontend

- [ ] `EXPO_PUBLIC_API_URL` documented and working for simulator/emulator
- [ ] Physical-device path documented (LAN IP + CORS) if team tests on real phones
- [ ] Auth gate: unauthenticated → login/register; authenticated → dashboard
- [ ] `401` handling: clear token and return to login (or documented gap)
- [ ] No committed secrets (`frontend/.env` stays local)

---

## CI & quality gates

- [ ] GitHub Actions (or equivalent): **lint + test on PR**
- [ ] Frontend lint runs clean (`cd frontend && npm run lint`) or failures tracked as known issues
- [ ] Changes merged via PR with at least one peer review
- [ ] No open P0/P1 bugs for US-01 or US-04

---

## Documentation

- [ ] [backend/README.md](../backend/README.md) — auth + dashboard endpoint table current
- [ ] [frontend/README.md](../frontend/README.md) — setup, auth modes, API URL notes current
- [ ] [database/README.md](../database/README.md) — docker compose + schema steps current
- [ ] Button → endpoint mapping matches implemented routes

---

## Demo-ready (optional but recommended)

- [ ] 5-minute demo script: register → login → home → tap 2–3 tools → logout
- [ ] Known limitations listed for stakeholders (mock data, email-only login, etc.)

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| PO | | | Acceptance criteria met |
| Frontend | | | US-04 + auth UI |
| Backend | | | Auth + plans + dashboard API |
| Database | | | Schema + local compose |
| Second dev setup | | | README verified |

**Sprint 1 status:** ☐ Not started · ☐ In progress · ☐ **Done**

---

## Explicitly out of scope (Sprint 2+)

Do **not** block Sprint 1 closeout on these — they are early stubs only:

- Real Google Maps / hotel API integrations (Sprint 2)
- Full bookmark CRUD UI (Sprint 3)
- AI chat with OpenAI proxy (Sprint 3)
- Themes (US-06, Sprint 3)
- Live safety/fare alerts (Sprint 4)

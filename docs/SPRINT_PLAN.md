# Wayfinder — 4-Sprint Plan

**Total duration:** 4 sprints × 2 weeks = 8 weeks to v1.0  
**Methodology:** Scrum

---

## MVP boundary

**Ship at end of Sprint 4:** A traveler can sign up, use a themed dashboard, discover places, compare hotels (price + amenities), bookmark favorites, chat with AI (including bookmark-aware recommendations), and receive safety and fare updates.

---

## Sprint 1 — Foundation & identity

**Goal:** Runnable repo, auth, and dashboard shell the team can build on.

| Story | Tasks |
|-------|-------|
| US-01 | Register, login, logout, session persistence |
| US-04 | Dashboard layout, tab navigation, empty states |
| — | Repo layout: `frontend/`, `backend/`, `database/`, `design/`, lint, `.env.example` |
| — | FastAPI scaffold + PostgreSQL/PostGIS local docker-compose |
| — | CI: lint + test on PR |
| — | Travel plan data model (CRUD stub) |

**Sprint 1 deliverables**
- [ ] Expo app boots on iOS simulator / Android emulator
- [ ] API auth endpoints (register, login, me)
- [ ] Dashboard with placeholder sections
- [ ] README setup steps verified by second dev

**Story points (suggested):** 21–26

---

## Sprint 2 — Discover & stay

**Goal:** Core travel utility — find places and evaluate hotels.

| Story | Tasks |
|-------|-------|
| US-02 | Location picker, radius control, places list + map pin |
| US-03 | Hotel search, price sort, comparison view |
| US-09 | Hotel detail + amenities panel |
| US-01 | Link saved travel plans to a destination |

**Sprint 2 deliverables**
- [ ] Popular places API integrated (or mocked with swap path)
- [ ] Hotel list with price comparison
- [ ] Hotel detail with amenities
- [ ] User can attach a plan to a city/region

**Story points (suggested):** 26–34

---

## Sprint 3 — Personalize & assist

**Goal:** Differentiation via bookmarks, themes, and AI chat.

| Story | Tasks |
|-------|-------|
| US-06 | Theme picker, persist preference, apply to dashboard |
| US-10 | Bookmark CRUD, saved list UI |
| US-05 | Chat UI, AI backend proxy, rate limiting |
| US-10 | Inject bookmarks into AI system prompt / context |

**Sprint 3 deliverables**
- [ ] 3+ themes working end-to-end
- [ ] Bookmarks from places and hotels
- [ ] AI chat answers travel questions
- [ ] AI references user bookmarks in recommendations

**Story points (suggested):** 29–34

---

## Sprint 4 — Real-time, safety & release

**Goal:** Confidence features, live deals, polish, and store-ready MVP.

| Story | Tasks |
|-------|-------|
| US-07 | Weather + travel advisory + neighborhood safety feed; notification prefs |
| US-08 | Price watch model, polling/webhook, in-app badges |
| — | Error handling, loading states, accessibility pass |
| — | E2E smoke tests, TestFlight / internal APK |
| — | Release notes, demo script, backlog for v1.1 |

**Sprint 4 deliverables**
- [ ] Safety updates visible per active trip
- [ ] Fare/price change alerts for watched items
- [ ] All 10 user stories meet acceptance criteria
- [ ] Team demo + retrospective complete

**Story points (suggested):** 26–34

---

## Backlog mapping summary

| ID | Story | Sprint |
|----|-------|--------|
| US-01 | Create account / save plans | 1 (auth), 2 (plans) |
| US-04 | Intuitive dashboard | 1 |
| US-02 | Popular places in radius | 2 |
| US-03 | Compare hotel prices | 2 |
| US-09 | Hotel amenities | 2 |
| US-06 | Dashboard theme | 3 |
| US-05 | AI chat | 3 |
| US-10 | Bookmarks + AI context | 3 |
| US-07 | Safety updates | 4 |
| US-08 | Live fare updates | 4 |

---

## Risks & dependencies

| Risk | Mitigation |
|------|------------|
| Hotel/fare API cost or limits | Mock layer in dev; trip DB API choice in Sprint 1 spike |
| AI latency / cost | Cache common answers; token limits per user |
| Google Maps / PostGIS setup | Database team owns PostGIS extension in Sprint 1 |
| Scope creep | MoSCoW tags; PO owns sprint scope |

---

## Team lanes per sprint

| Sprint | Frontend | Backend | Database | Design |
|--------|----------|---------|----------|--------|
| 1 | Expo shell, dashboard tabs | FastAPI project, auth routes | Users + plans schema, PostGIS enable | Dashboard wireframes, nav |
| 2 | Maps UI, places list, hotel screens | Google Maps proxy, hotel API | Places/hotels cache tables, geo queries | Hotel detail, amenities UI |
| 3 | Chat UI, themes, bookmarks | OpenAI proxy, bookmark context | Bookmarks, chat session storage | Theme presets, chat bubbles |
| 4 | Alerts UI, price badges | Weather + advisory APIs, fare polling | Alert subscriptions schema | Safety feed, notification patterns |

---

## Post-MVP backlog (v1.1)

From project goals—not in Sprint 1–4 commitment:

- **Worthiness ranking** — score activities from user behavior / bookmarks
- **AI itinerary generation** — multi-day plan export from LLM agent

---

## Recommended Sprint 1 spikes (Week 1)

1. **Google Maps / Places** — 4h spike, radius search POC
2. **Weather + Travel Advisory APIs** — 4h spike, response shape doc
3. **Trip / hotel database API** — 4h spike, pricing fields
4. **OpenAI** — 2h spike, system prompt + bookmark context draft
5. **Cloud host** — 2h spike, pick AWS vs Azure vs Firebase


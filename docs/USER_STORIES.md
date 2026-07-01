# Wayfinder — User Stories

Format: **As a** [role], **I want** [goal], **so that** [benefit].

## Epic 1: Account & identity

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a **user**, I want to **create an account** so I can **save my travel plans**. | Must |

**Acceptance criteria**
- User can register with email + password (or OAuth stretch)
- User can log in and log out
- Travel plans persist to the user's account
- Invalid credentials show clear errors

---

## Epic 2: Discovery

| ID | Story | Priority |
|----|-------|----------|
| US-02 | As a **traveler**, I want to **see the most popular places within a specified radius** so I can **discover where to go**. | Must |

**Acceptance criteria**
- User sets location (GPS or search)
- User sets radius (e.g. 1–25 km)
- App shows ranked popular places with name, category, distance
- Empty state when no results

---

## Epic 3: Hotels & stays

| ID | Story | Priority |
|----|-------|----------|
| US-03 | As a **traveler**, I want to **compare hotel prices** so I can **find affordable places to stay**. | Must |
| US-09 | As a **traveler**, I want to **view the amenities of a hotel** so I can **be satisfied with my stay**. | Must |

**Acceptance criteria (US-03)**
- List hotels for a destination or dates
- Sort/filter by price
- Show nightly rate and total estimate

**Acceptance criteria (US-09)**
- Hotel detail screen lists amenities (Wi‑Fi, pool, breakfast, etc.)
- Amenities sourced from API or structured mock data

---

## Epic 4: Dashboard & UX

| ID | Story | Priority |
|----|-------|----------|
| US-04 | As a **user**, I want an **intuitive dashboard** so I can **navigate through my travel needs with ease**. | Must |
| US-06 | As a **user**, I want to **customize my dashboard with a personalized theme** so it **fits my aesthetic**. | Should |

**Acceptance criteria (US-04)**
- Home dashboard with clear entry points: Explore, Hotels, Saved, AI Chat, Profile
- Consistent navigation (tabs or drawer)
- Works on common phone screen sizes

**Acceptance criteria (US-06)**
- At least 3 theme presets (e.g. light, dark, accent color)
- Theme persists across sessions

---

## Epic 5: AI assistant

| ID | Story | Priority |
|----|-------|----------|
| US-05 | As a **traveler**, I want to **chat with an AI agent** if I have questions or want recommendations. | Must |
| US-10 | As a **user**, I want to **bookmark favorite places** and have the **AI chatbot read them** for **more personalized recommendations**. | Must |

**Acceptance criteria (US-05)**
- Chat UI with message history per session
- AI answers travel-related questions
- Graceful fallback when AI unavailable

**Acceptance criteria (US-10)**
- User can bookmark places from discovery/hotel screens
- Bookmarks list on profile or dashboard
- AI chat context includes user's bookmarks when suggesting places

---

## Epic 6: Safety & deals

| ID | Story | Priority |
|----|-------|----------|
| US-07 | As a **user**, I want to **receive safety updates** so I can **travel more confidently**. | Should |
| US-08 | As a **traveler**, I want **live updates on fare prices** so I can **find better deals in real time and save money**. | Should |

**Acceptance criteria (US-07)**
- Safety alerts for user's destination (advisories, weather, etc.)
- Notifications or in-app feed
- User can dismiss or mute by trip

**Acceptance criteria (US-08)**
- Fare/hotel price watch for saved routes or hotels
- In-app indicator when price drops
- Timestamp of last update visible

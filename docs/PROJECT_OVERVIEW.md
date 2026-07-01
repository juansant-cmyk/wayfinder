# Wayfinder — Project Overview

## Problem statement

Travelers need a mobile app that is easy to use, keeps them safe, and helps them find the best deals. Wayfinder adds AI-integrated layers on top of core travel utilities so planning feels guided—not overwhelming.

## Project goals

| Goal | Description | MVP |
|------|-------------|-----|
| **Recommendations** | Suggest attractions, restaurants, and hotels based on user preferences and budget | Sprint 2–3 (places, hotels, AI + bookmarks) |
| **Safety alerts** | Weather risks, unsafe neighborhoods, government travel advisories via API aggregation | Sprint 4 (US-07) |
| **Worthiness ranking** | Rank activities by learned user habits | v1.1 stretch (post-MVP) |
| **Itinerary generation** | AI agents / LLMs generate full travel itineraries | v1.1 stretch (post-MVP) |

## Scope of work

### Team structure

| Team | Responsibility |
|------|----------------|
| **Frontend** | React Native (Expo) app, dashboard, maps UI, chat UI |
| **Backend** | FastAPI services, API integrations, AI proxy |
| **Database** | PostgreSQL + PostGIS schema, migrations, geo queries |
| **Design** | Wireframes, themes, component library |

### Core MVP features

- User-friendly **dashboard** with real-time AI integration
- **AI agent chatbot** for travel Q&A and personalized guidance
- All user stories in [USER_STORIES.md](USER_STORIES.md)

### Your role (PO / QA / Backend)

- **Product Owner:** backlog, sprint scope, acceptance criteria
- **QA & coordination:** Definition of Done, test plans, cross-team sync
- **Backend contributor:** FastAPI endpoints, API integration, AI layer support

## Tech stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python, FastAPI |
| **Database** | PostgreSQL + PostGIS |
| **Frontend** | React Native with Expo |
| **APIs** | Google Maps, Weather, Travel Advisory, Trip/hotel databases |
| **AI** | OpenAI or comparable LLM |
| **Cloud** | AWS, Azure, or Firebase (decide in Sprint 1) |

## Architecture (high level)

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────┐
│  Expo app   │────▶│   FastAPI   │────▶│ PostgreSQL       │
│ (frontend/) │     │ (backend/)  │     │ + PostGIS        │
└─────────────┘     └──────┬──────┘     └──────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         Google Maps   Weather /     OpenAI
         Places API    Advisory APIs  LLM
```

## Related docs

- [USER_STORIES.md](USER_STORIES.md)
- [SPRINT_PLAN.md](SPRINT_PLAN.md)
- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)

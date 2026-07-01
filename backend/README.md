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

## Setup (Sprint 1)

Scaffolding will be added here. Expected flow:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

## Related docs

- [../docs/PROJECT_OVERVIEW.md](../docs/PROJECT_OVERVIEW.md)
- [../docs/SPRINT_PLAN.md](../docs/SPRINT_PLAN.md)

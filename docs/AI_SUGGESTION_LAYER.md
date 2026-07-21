# AI suggestion layer (save for later)

Wayfinder should integrate API + favorites/ratings data and use an AI model to interpret context in real time — places, hotels, food (e.g. rainy/cold → soup), etc.

## Pipeline

1. **Collect** live context (destination, weather, dates, favorites)
2. **Score** candidates with light rules + embeddings (weather affinity, distance, saved prefs)
3. **Narrate** with the model (“Because it’s rainy and you liked ramen spots…”) so suggestions feel grounded, not random

## First demo angle

Weather → food is an obvious, delightful loop for a first “suggest tonight” style feature.

## Existing building blocks

- Weather, hotels, geo, plans/itinerary, favorites
- Chat / travel-check style surfaces for narration

## Implementation (backend)

Long-term default: **OpenAI** orchestrates tools + subagents; optional **Claude Sonnet** narrator.

```text
POST /chat/messages
  → services/chat.py
  → services/ai/orchestrator.py
       collect (context.py) → score (scoring.py) → route agent
       → ChatProvider (mock | openai_chat.py)
       → optional NarratorProvider (anthropic_chat.py)
  → subagents: planner | lodging | suggest_tonight
```

| Env | Purpose |
|-----|---------|
| `CHAT_PROVIDER=mock\|openai` | Primary brain |
| `OPENAI_API_KEY` / `OPENAI_CHAT_MODEL` | Live OpenAI |
| `NARRATOR_PROVIDER=none\|anthropic\|openai` | Optional prose polish |
| `ANTHROPIC_API_KEY` | Claude narrator |

Key paths: `backend/app/services/ai/`, `backend/app/providers/openai_chat.py`, `backend/app/providers/anthropic_chat.py`.

### Class scope vs Full discovery

| Phase | Scoring |
|-------|---------|
| **Class** | Context-aware **seeds** (weather + favorites affinity + active plan) |
| **After class — Full discovery** | Live hotels, popular attractions, and favorites near the plan center — all contexts combined (weather, distance, preferences). Classifier replaces keyword routing (keywords stay as fallback). |

Safety context, tool-calling loops, and multi-agent expansion follow Full discovery.

"""Subagent contracts — OpenAI orchestrator routes work here later."""

from __future__ import annotations

from typing import Protocol

from app.services.ai.context import TripChatContext


class SubAgent(Protocol):
    name: str
    description: str

    async def run(self, ctx: TripChatContext) -> str: ...


# Expandable keyword lists per agent. Order = priority (first match wins).
# Keep as an offline fallback. Primary routing will move to a classifier
# (or OpenAI tool choice); when that ships, call route_agent_name only if
# the classifier is unavailable or low-confidence.
LODGING_KEYWORDS = [
    "hotel",
    "stay",
    "lodging",
    "room",
    "accommodation",
    "check-in",
    "check in",
]

SUGGEST_TONIGHT_KEYWORDS = [
    "tonight",
    "eat",
    "food",
    "restaurant",
    "ramen",
    "dinner",
    "lunch",
    "cafe",
    "coffee",
]

PLANNER_KEYWORDS = [
    "plan",
    "itinerary",
    "day",
    "trip",
    "schedule",
    "activities",
]

# (agent_name, keywords) — append new agents here as they ship.
INTENT_ROUTES: list[tuple[str, list[str]]] = [
    ("lodging", LODGING_KEYWORDS),
    ("suggest_tonight", SUGGEST_TONIGHT_KEYWORDS),
    ("planner", PLANNER_KEYWORDS),
]


def route_agent_name(message: str) -> str:
    """Keyword fallback router. Replace call sites with a classifier later."""
    text = message.lower()
    for agent_name, keywords in INTENT_ROUTES:
        if any(keyword in text for keyword in keywords):
            return agent_name
    return "orchestrator"

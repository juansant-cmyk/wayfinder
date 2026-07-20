"""Trip chat context: collect live Wayfinder state before scoring / agents."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import TravelPlan
from app.providers.registry import get_current_weather_provider
from app.services import favorites as favorites_service
from app.services import plans as plan_service

logger = logging.getLogger("wayfinder.ai.context")

FAVORITES_CAP = 10


@dataclass
class ScoredCandidate:
    kind: str  # place | hotel | food | activity
    id: str
    title: str
    score: float
    reason: str
    metadata: dict = field(default_factory=dict)


@dataclass
class TripChatContext:
    user_id: UUID
    message: str
    destination: str | None = None
    plan_id: UUID | None = None
    plan_title: str | None = None
    center_lat: float | None = None
    center_lng: float | None = None
    weather_summary: str | None = None
    favorite_titles: list[str] = field(default_factory=list)
    favorite_snapshots: list[dict] = field(default_factory=list)
    candidates: list[ScoredCandidate] = field(default_factory=list)
    route_agent: str = "orchestrator"


def pick_active_plan(plans: list[TravelPlan], message: str) -> TravelPlan | None:
    """
    1 active plan -> use it.
    Several -> match message to destination_name (case-insensitive substring).
    No match -> most recently updated (list is already updated_at desc).
    """
    if not plans:
        return None
    if len(plans) == 1:
        return plans[0]

    text = message.lower()
    for plan in plans:
        dest = (plan.destination_name or "").strip().lower()
        title = (plan.title or "").strip().lower()
        if dest and dest in text:
            return plan
        if title and title in text:
            return plan
        # Token overlap: "Seoul" in "Seoul, South Korea"
        for token in dest.replace(",", " ").split():
            if len(token) >= 3 and token in text:
                return plan

    return plans[0]


def _weather_summary_line(
    *,
    destination: str | None,
    condition: str | None,
    temp_c: float | None,
    forecast_summary: str | None,
) -> str:
    parts = []
    if destination:
        parts.append(destination)
    if condition:
        parts.append(condition)
    if temp_c is not None:
        parts.append(f"{temp_c:.0f}°C")
    head = ", ".join(parts) if parts else "Weather"
    if forecast_summary:
        return f"{head}. {forecast_summary}"
    return head


async def collect_trip_context(
    db: AsyncSession,
    user_id: UUID,
    message: str,
) -> TripChatContext:
    """Load active plan, weather (soft-fail), and favorite snapshots (cap 10)."""
    active_plans = await plan_service.list_plans(
        db, user_id, status_filter=plan_service.PLAN_STATUS_ACTIVE
    )
    plan = pick_active_plan(active_plans, message)

    destination = plan.destination_name if plan else None
    plan_title = plan.title if plan else None
    plan_id = plan.id if plan else None
    center_lat = plan.center_lat if plan else None
    center_lng = plan.center_lng if plan else None

    weather_summary = None
    if destination or (center_lat is not None and center_lng is not None):
        try:
            provider = get_current_weather_provider()
            report = await provider.current_weather(destination, center_lat, center_lng)
            weather_summary = _weather_summary_line(
                destination=report.destination or destination,
                condition=report.condition,
                temp_c=report.temp_c,
                forecast_summary=report.forecast_summary,
            )
        except Exception:
            logger.exception(
                "Weather collect soft-failed for user=%s dest=%s", user_id, destination
            )
            weather_summary = None

    favorite_titles: list[str] = []
    favorite_snapshots: list[dict] = []
    try:
        favorites = await favorites_service.list_favorites(db, user_id)
        for fav in favorites[:FAVORITES_CAP]:
            favorite_titles.append(fav.title)
            favorite_snapshots.append(
                {
                    "item_type": fav.item_type,
                    "provider": fav.provider,
                    "provider_item_id": fav.provider_item_id,
                    "title": fav.title,
                    "subtitle": fav.subtitle,
                    "address": fav.address,
                    "lat": fav.lat,
                    "lng": fav.lng,
                    "price": fav.price,
                    "currency": fav.currency,
                    "rating": fav.rating,
                    "image_url": fav.image_url,
                    "snapshot": fav.snapshot,
                }
            )
    except Exception:
        logger.exception("Favorites collect failed for user=%s", user_id)

    return TripChatContext(
        user_id=user_id,
        message=message,
        destination=destination,
        plan_id=plan_id,
        plan_title=plan_title,
        center_lat=center_lat,
        center_lng=center_lng,
        weather_summary=weather_summary,
        favorite_titles=favorite_titles,
        favorite_snapshots=favorite_snapshots,
    )

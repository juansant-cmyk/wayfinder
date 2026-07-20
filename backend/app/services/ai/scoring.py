"""Rule scoring — class scope uses context-aware seeds (Full discovery later)."""

from __future__ import annotations

from app.services.ai.context import ScoredCandidate, TripChatContext


def score_candidates(ctx: TripChatContext) -> list[ScoredCandidate]:
    """
    Class scope (A): seed ideas scored with live weather + favorites affinity.

    Post-class (Full discovery / C): replace seeds with live hotels, places, and
    favorites near the plan center, still scored with weather + preference boosts.
    """
    weather = (ctx.weather_summary or "").lower()
    rainy = any(token in weather for token in ("rain", "storm", "drizzle", "thunder"))
    cold = any(token in weather for token in ("cold", "snow", "sleet", "freezing"))
    dest = ctx.destination or "your destination"

    seeds = [
        ScoredCandidate(
            kind="food",
            id="seed-ramen",
            title="Neighborhood ramen",
            score=0.82 if rainy or cold else 0.55,
            reason=(
                "Warm bowl for wet or cold weather" if rainy or cold else "Popular local staple"
            ),
            metadata={"destination": dest},
        ),
        ScoredCandidate(
            kind="place",
            id="seed-museum",
            title="Indoor gallery",
            score=0.78 if rainy else 0.45,
            reason="Rainy-day indoor plan" if rainy else "Culture stop",
            metadata={"destination": dest},
        ),
        ScoredCandidate(
            kind="place",
            id="seed-park",
            title="Scenic outdoor walk",
            score=0.35 if rainy else 0.7,
            reason="Skip if wet; great when skies clear",
            metadata={"destination": dest},
        ),
        ScoredCandidate(
            kind="hotel",
            id="seed-hotel",
            title=(f"Stay near {ctx.plan_title}" if ctx.plan_title else "Central stay"),
            score=0.62,
            reason="Walkable base near your planned destination",
            metadata={
                "destination": dest,
                "lat": ctx.center_lat,
                "lng": ctx.center_lng,
            },
        ),
    ]

    fav_blobs: list[str] = []
    for title in ctx.favorite_titles:
        fav_blobs.append(title.lower())
    for snap in ctx.favorite_snapshots:
        for key in ("title", "address", "subtitle"):
            val = snap.get(key)
            if isinstance(val, str) and val.strip():
                fav_blobs.append(val.lower())
        nested = snap.get("snapshot") or {}
        if isinstance(nested, dict):
            for key in ("name", "address", "subtitle"):
                val = nested.get(key)
                if isinstance(val, str) and val.strip():
                    fav_blobs.append(val.lower())

    for item in seeds:
        title_l = item.title.lower()
        if any(blob and (blob in title_l or title_l in blob) for blob in fav_blobs):
            item.score = min(1.0, item.score + 0.15)
            item.reason = f"{item.reason}; matches a favorite"
            continue
        kinds_hint = " ".join(fav_blobs)
        if item.kind == "food" and any(
            w in kinds_hint for w in ("ramen", "food", "restaurant", "cafe")
        ):
            item.score = min(1.0, item.score + 0.08)
            item.reason = f"{item.reason}; food favorites on file"
        if item.kind == "hotel" and any(
            w in kinds_hint for w in ("hotel", "stay", "inn", "resort")
        ):
            item.score = min(1.0, item.score + 0.08)
            item.reason = f"{item.reason}; lodging favorites on file"

    seeds.sort(key=lambda c: c.score, reverse=True)
    ctx.candidates = seeds
    return seeds

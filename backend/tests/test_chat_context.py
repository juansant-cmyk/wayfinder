"""Unit tests for chat plan resolution (no DB)."""

from datetime import UTC, datetime
from uuid import uuid4

from app.models.travel import TravelPlan
from app.services.ai.context import pick_active_plan


def _plan(*, destination: str, title: str = "Trip", updated_offset: int = 0) -> TravelPlan:
    plan = TravelPlan(
        id=uuid4(),
        user_id=uuid4(),
        title=title,
        destination_name=destination,
        status="active",
    )
    plan.updated_at = datetime(2026, 1, 1, tzinfo=UTC).replace(day=1 + updated_offset)
    return plan


def test_pick_single_active_plan():
    only = _plan(destination="Tokyo, Japan")
    assert pick_active_plan([only], "what should I eat?") is only


def test_pick_matches_destination_in_message():
    seoul = _plan(destination="Seoul, South Korea", updated_offset=0)
    tokyo = _plan(destination="Tokyo, Japan", updated_offset=5)
    # tokyo is more recently updated but message names Seoul
    assert pick_active_plan([tokyo, seoul], "hotels in Seoul") is seoul


def test_pick_falls_back_to_most_recent():
    older = _plan(destination="Paris", updated_offset=0)
    newer = _plan(destination="Bali", updated_offset=10)
    # list_plans orders updated_at desc — first entry wins on no match
    assert pick_active_plan([newer, older], "any tips?") is newer

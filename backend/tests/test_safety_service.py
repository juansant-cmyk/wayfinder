from datetime import UTC, datetime

import pytest

from app.providers.base import ProviderSafetyAlert
from app.services.safety import alert_dedupe_key, normalize_severity, score_to_level

pytestmark = pytest.mark.unit


def alert(*, starts_at=None, ends_at=None) -> ProviderSafetyAlert:
    return ProviderSafetyAlert(
        source="weatherapi",
        destination="Resolved provider label",
        alert_type="weather",
        severity="Severe",
        title="Flood Warning",
        event="Flood",
        description="Flooding is possible.",
        starts_at=starts_at,
        ends_at=ends_at,
    )


def test_safety_severity_uses_app_levels():
    assert normalize_severity("Extreme") == "extreme"
    assert normalize_severity("Severe") == "high"
    assert normalize_severity("Moderate") == "moderate"
    assert normalize_severity("Minor") == "low"


def test_alert_dedupe_key_uses_requested_destination_and_times():
    first = alert(starts_at=datetime(2026, 7, 18, tzinfo=UTC))
    repeated = alert(starts_at=datetime(2026, 7, 18, tzinfo=UTC))
    later = alert(starts_at=datetime(2026, 7, 19, tzinfo=UTC))

    assert alert_dedupe_key(first, "Tokyo, Japan") == alert_dedupe_key(
        repeated, "Tokyo, Japan"
    )
    assert alert_dedupe_key(first, "Tokyo, Japan") != alert_dedupe_key(
        later, "Tokyo, Japan"
    )
    assert alert_dedupe_key(first, "Tokyo, Japan") != alert_dedupe_key(
        first, "Seoul, South Korea"
    )


def test_provider_alert_id_is_stable_across_city_labels():
    item = alert(starts_at=datetime(2026, 7, 18, tzinfo=UTC))
    object.__setattr__(item, "provider_alert_id", "gdacs-42")

    assert alert_dedupe_key(item, "Tokyo, Japan") == alert_dedupe_key(
        item, "Osaka, Japan"
    )


@pytest.mark.parametrize(
    ("score", "level"),
    [(0, "low"), (1.49, "low"), (1.5, "moderate"), (2.5, "high"), (3.5, "extreme"), (5, "extreme")],
)
def test_score_to_level(score, level):
    assert score_to_level(score) == level

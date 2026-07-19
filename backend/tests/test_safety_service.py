from datetime import datetime, timezone

import pytest

from app.providers.base import ProviderSafetyAlert
from app.services.safety import alert_dedupe_key, normalize_severity

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
    first = alert(starts_at=datetime(2026, 7, 18, tzinfo=timezone.utc))
    repeated = alert(starts_at=datetime(2026, 7, 18, tzinfo=timezone.utc))
    later = alert(starts_at=datetime(2026, 7, 19, tzinfo=timezone.utc))

    assert alert_dedupe_key(first, "Tokyo, Japan") == alert_dedupe_key(
        repeated, "Tokyo, Japan"
    )
    assert alert_dedupe_key(first, "Tokyo, Japan") != alert_dedupe_key(
        later, "Tokyo, Japan"
    )
    assert alert_dedupe_key(first, "Tokyo, Japan") != alert_dedupe_key(
        first, "Seoul, South Korea"
    )

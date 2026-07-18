from app.services.geocode import _dedupe_suggestions


def test_dedupe_suggestions_keeps_first_five_unique():
    items = [
        {"label": "Tokyo, Japan"},
        {"label": "tokyo, japan"},
        {"label": "Osaka, Japan"},
        {"label": "Kyoto, Japan"},
        {"label": "Nagoya, Japan"},
        {"label": "Sapporo, Japan"},
        {"label": "Fukuoka, Japan"},
    ]
    result = _dedupe_suggestions(items, limit=5)
    assert len(result) == 5
    assert result[0]["label"] == "Tokyo, Japan"
    assert [item["label"] for item in result] == [
        "Tokyo, Japan",
        "Osaka, Japan",
        "Kyoto, Japan",
        "Nagoya, Japan",
        "Sapporo, Japan",
    ]

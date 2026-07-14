import pytest

from app.services.geocode import _label_from_parts, _title_case

pytestmark = pytest.mark.unit


def test_title_case_place():
    assert _title_case("san jose") == "San Jose"


def test_label_from_parts_prefers_city_region():
    assert _label_from_parts("San Jose", "California", "United States") == "San Jose, California"

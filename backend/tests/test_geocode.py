import pytest

from app.services.geocode import (
    _google_components,
    _label_from_parts,
    _title_case,
    normalize_country_codes,
)

pytestmark = pytest.mark.unit


def test_title_case_place():
    assert _title_case("san jose") == "San Jose"


def test_label_from_parts_prefers_city_region():
    assert _label_from_parts("San Jose", "California", "United States") == "San Jose, California"


def test_country_codes_normalize_names_alpha2_and_alpha3():
    assert normalize_country_codes("Japan") == ("JP", "JPN")
    assert normalize_country_codes("jp") == ("JP", "JPN")
    assert normalize_country_codes("JPN") == ("JP", "JPN")
    assert normalize_country_codes("not-a-country") == (None, None)


def test_google_country_short_name_is_preserved():
    parts = _google_components(
        [{"long_name": "Japan", "short_name": "JP", "types": ["country", "political"]}]
    )

    assert parts == {"country": "Japan", "country_code": "JP"}

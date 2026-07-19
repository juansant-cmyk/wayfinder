import json

import httpx
import pytest

from app.providers.google_places import (
    GooglePlacesMissingKey,
    GooglePlacesProvider,
    category_to_google_type,
    map_google_place,
)

pytestmark = pytest.mark.unit


def google_place_payload() -> dict:
    return {
        "id": "google-place-1",
        "displayName": {"text": "Harbor Cafe"},
        "formattedAddress": "1 Bay Street",
        "location": {"latitude": 37.79, "longitude": -122.39},
        "rating": 4.6,
        "userRatingCount": 321,
        "primaryType": "cafe",
        "primaryTypeDisplayName": {"text": "Cafe"},
        "types": ["cafe", "restaurant"],
        "regularOpeningHours": {"openNow": True},
        "photos": [{"name": "places/google-place-1/photos/photo-1"}],
        "googleMapsUri": "https://maps.google.com/?cid=1",
    }


def test_google_category_mapping():
    assert category_to_google_type("restaurants") == "restaurant"
    assert category_to_google_type("transit-stations") == "transit_station"
    assert category_to_google_type("more") is None


def test_google_place_payload_maps_to_provider_place():
    place = map_google_place(google_place_payload(), "cafes")

    assert place is not None
    assert place.provider == "google"
    assert place.provider_place_id == "google-place-1"
    assert place.category == "cafe"
    assert place.rating == 4.6
    assert place.metadata_json["open_now"] is True
    assert place.metadata_json["rating_count"] == 321


@pytest.mark.asyncio
async def test_google_places_provider_calls_search_nearby():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/places:searchNearby"
        assert request.headers["X-Goog-Api-Key"] == "dummy-google-key"
        body = json.loads(request.content)
        assert body["includedTypes"] == ["restaurant"]
        assert body["locationRestriction"]["circle"]["radius"] == 5000
        return httpx.Response(200, json={"places": [google_place_payload()]})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    provider = GooglePlacesProvider(
        api_key="dummy-google-key",
        base_url="https://places.googleapis.com/v1",
        client=client,
    )

    places = await provider.popular_places(37.79, -122.39, 5, "restaurants", 10)

    assert len(places) == 1
    assert places[0].name == "Harbor Cafe"
    await client.aclose()


@pytest.mark.asyncio
async def test_google_places_missing_key_fails_before_request():
    provider = GooglePlacesProvider(api_key="")

    with pytest.raises(GooglePlacesMissingKey):
        await provider.popular_places(37.79, -122.39, 5, None, 10)

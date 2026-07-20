import httpx
import pytest

from app.providers.liteapi import (
    LiteApiHotelProvider,
    extract_offer_total,
    map_liteapi_hotel_details,
    map_liteapi_search_hotel,
    pick_cheapest_room_type,
)

pytestmark = pytest.mark.unit


SAMPLE_ROOM_CHEAP = {
    "offerId": "offer-cheap",
    "offerRetailRate": {"amount": 120.0, "currency": "USD"},
    "rates": [
        {
            "boardName": "Room Only",
            "name": "Queen",
            "cancellationPolicies": {"refundableTag": "RFN"},
        }
    ],
}

SAMPLE_ROOM_EXPENSIVE = {
    "offerId": "offer-exp",
    "offerRetailRate": {"amount": 220.0, "currency": "USD"},
    "rates": [{"boardName": "Breakfast", "name": "King"}],
}

SAMPLE_RATE_ROW = {
    "hotelId": "lp1897",
    "roomTypes": [SAMPLE_ROOM_EXPENSIVE, SAMPLE_ROOM_CHEAP],
}

SAMPLE_HOTEL_INFO = {
    "id": "lp1897",
    "name": "Bali Garden Resort",
    "main_photo": "https://example.com/hotel.jpg",
    "thumbnail": "https://example.com/thumb.jpg",
    "address": "12 Beach Road",
    "city_name": "Bali",
    "latitude": -8.34,
    "longitude": 115.09,
    "rating": 4.6,
    "stars": 4,
    "review_count": 128,
    "tags": ["Outdoor pool", "Free parking", "Fitness centre", "Wi-Fi"],
    "hotelFacilities": ["Swimming pool", "Parking", "Gym"],
}


def lite_api_search_response() -> dict:
    """Example POST /hotels/rates payload (includeHotelData) shaped like LiteAPI.

    Asserts the fixture matches the structure LiteApiHotelProvider.search_hotels
    reads: top-level ``data`` rate rows + ``hotels`` content rows.
    """
    response = {
        "data": [SAMPLE_RATE_ROW],
        "hotels": [SAMPLE_HOTEL_INFO],
        "sandbox": True,
    }

    assert isinstance(response, dict)
    assert isinstance(response["data"], list) and response["data"]
    assert isinstance(response["hotels"], list) and response["hotels"]

    rate_row = response["data"][0]
    assert isinstance(rate_row.get("hotelId"), str) and rate_row["hotelId"]
    assert isinstance(rate_row.get("roomTypes"), list) and rate_row["roomTypes"]

    offer = rate_row["roomTypes"][0]
    assert isinstance(offer, dict)
    assert offer.get("offerId") or offer.get("offerRetailRate") or offer.get("rates")
    if offer.get("rates") is not None:
        assert isinstance(offer["rates"], list) and offer["rates"]
        rate = offer["rates"][0]
        assert isinstance(rate, dict)

    hotel = response["hotels"][0]
    assert isinstance(hotel, dict)
    assert str(hotel.get("id") or "")
    assert hotel.get("name")
    # Provider maps coords / photos from these hotel-content fields.
    assert hotel.get("latitude") is not None or hotel.get("main_photo") or hotel.get("address")

    return response


def test_lite_api_search_response_shape():
    payload = lite_api_search_response()
    hotel = map_liteapi_search_hotel(payload["data"][0], payload["hotels"][0], nights=2)
    assert hotel is not None
    assert hotel.provider_hotel_id == payload["data"][0]["hotelId"]


def test_pick_cheapest_room_type():
    cheapest = pick_cheapest_room_type([SAMPLE_ROOM_EXPENSIVE, SAMPLE_ROOM_CHEAP])
    assert cheapest is not None
    assert cheapest["offerId"] == "offer-cheap"


def test_extract_offer_total_from_retail_rate_array():
    room = {
        "rates": [
            {
                "retailRate": {
                    "total": [{"amount": "99.5", "currency": "EUR"}],
                }
            }
        ]
    }
    amount, currency = extract_offer_total(room)
    assert amount == 99.5
    assert currency == "EUR"


def test_map_liteapi_search_hotel():
    hotel = map_liteapi_search_hotel(SAMPLE_RATE_ROW, SAMPLE_HOTEL_INFO, nights=2)
    assert hotel is not None
    assert hotel.provider == "liteapi"
    assert hotel.provider_hotel_id == "lp1897"
    assert hotel.name == "Bali Garden Resort"
    assert hotel.total_estimate == 120.0
    assert hotel.nightly_rate == 60.0
    assert hotel.currency == "USD"
    assert hotel.lat == -8.34
    assert hotel.amenities[:5] == ["Pool", "Parking", "Gym", "Wi-Fi included", "Free cancellation"]
    assert "Room Only" in hotel.amenities
    assert hotel.metadata_json["offer_id"] == "offer-cheap"
    assert hotel.metadata_json["image_url"] == "https://example.com/hotel.jpg"
    assert hotel.metadata_json["cancellation"] == "Free cancellation"


def test_extract_featured_amenities_and_cancellation():
    from app.providers.liteapi import (
        classify_facility_label,
        extract_cancellation_label,
        extract_featured_amenities,
        featured_amenities_from_facility_ids,
    )

    assert extract_featured_amenities(["Free WiFi", "Outdoor pool", "On-site parking"]) == [
        "Pool",
        "Parking",
        "Wi-Fi included",
    ]
    assert classify_facility_label("Free WiFi") == "Wi-Fi included"
    assert classify_facility_label("billiards or pool table") is None
    assert classify_facility_label("Fitness facilities") == "Gym"
    assert featured_amenities_from_facility_ids(
        [492, 47, 999],
        {492: "Gym", 47: "Parking"},
    ) == ["Parking", "Gym"]
    assert (
        extract_cancellation_label({"rates": [{"cancellationPolicies": {"refundableTag": "NRFN"}}]})
        == "Non-refundable"
    )


def test_map_liteapi_hotel_details():
    hotel = map_liteapi_hotel_details(
        {
            "data": {
                "id": "lp1897",
                "name": "Bali Garden Resort",
                "address": "12 Beach Road",
                "city": "Bali",
                "country": "ID",
                "starRating": 4,
                "main_photo": "https://example.com/hotel.jpg",
                "hotelDescription": "<p>A <strong>lovely</strong> stay.</p>",
                "hotelFacilities": ["Pool", "Spa", "Wi-Fi", "Parking", "Gym"],
                "location": {"latitude": -8.34, "longitude": 115.09},
                "hotelImages": [{"url": "https://example.com/a.jpg", "defaultImage": True}],
            }
        }
    )
    assert hotel.provider_hotel_id == "lp1897"
    assert hotel.rating == 4.0
    assert hotel.amenities[:4] == ["Pool", "Parking", "Gym", "Wi-Fi included"]
    assert "Spa" in hotel.amenities
    assert hotel.metadata_json["description"] == "A lovely stay."
    assert hotel.metadata_json["image_url"] == "https://example.com/hotel.jpg"
    assert hotel.nightly_rate == 0.0


@pytest.mark.asyncio
async def test_liteapi_search_hotels_happy_path():
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if request.method == "POST" and path.endswith("/hotels/rates"):
            assert request.headers.get("X-API-Key") == "test-key"
            return httpx.Response(200, json=lite_api_search_response())
        if request.method == "GET" and path.endswith("/data/hotels"):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "id": "lp1897",
                            "facilityIds": [3, 47, 492, 107],
                        }
                    ]
                },
            )
        if request.method == "GET" and path.endswith("/data/facilities"):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {"facility_id": 3, "facility": "Swimming pool"},
                        {"facility_id": 47, "facility": "Parking"},
                        {"facility_id": 492, "facility": "Fitness facilities"},
                        {"facility_id": 107, "facility": "Free WiFi"},
                    ]
                },
            )
        return httpx.Response(404, json={"error": "unexpected"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        hotels = await provider.search_hotels(
            "Bali", None, None, "2026-11-01", "2026-11-03", 2, "price"
        )

    assert len(hotels) == 1
    assert hotels[0].provider_hotel_id == "lp1897"
    assert hotels[0].amenities[:4] == ["Pool", "Parking", "Gym", "Wi-Fi included"]
    assert hotels[0].metadata_json["check_in"] == "2026-11-01"
    assert hotels[0].metadata_json["check_out"] == "2026-11-03"


@pytest.mark.asyncio
async def test_liteapi_search_uses_geo_when_provided():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST" and request.url.path.endswith("/hotels/rates"):
            captured["body"] = request.read()
            return httpx.Response(200, json={"data": [], "hotels": []})
        return httpx.Response(200, json={"data": []})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        await provider.search_hotels(None, -8.34, 115.09, None, None, 1, "distance")

    import json

    body = json.loads(captured["body"].decode())
    assert body["latitude"] == -8.34
    assert body["longitude"] == 115.09
    assert "aiSearch" not in body


@pytest.mark.asyncio
async def test_liteapi_get_hotel_details_happy_path():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert "hotelId=lp1897" in str(request.url)
        return httpx.Response(
            200,
            json={
                "data": {
                    "id": "lp1897",
                    "name": "Bali Garden Resort",
                    "address": "12 Beach Road",
                    "city": "Bali",
                    "starRating": 4,
                    "main_photo": "https://example.com/hotel.jpg",
                    "hotelFacilities": ["Pool"],
                    "location": {"latitude": -8.34, "longitude": 115.09},
                }
            },
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        hotel = await provider.get_hotel_details("lp1897")

    assert hotel.name == "Bali Garden Resort"
    assert hotel.provider == "liteapi"


@pytest.mark.asyncio
async def test_liteapi_search_passes_market_overrides():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        import json

        captured["body"] = json.loads(request.content.decode())
        return httpx.Response(200, json={"data": [], "hotels": []})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        await provider.search_hotels(
            "Tokyo",
            None,
            None,
            None,
            None,
            1,
            "price",
            guest_nationality="jp",
            currency="jpy",
        )

    assert captured["body"]["guestNationality"] == "JP"
    assert captured["body"]["currency"] == "JPY"


@pytest.mark.asyncio
async def test_liteapi_get_hotel_details_404():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"error": "not found"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        with pytest.raises(LookupError):
            await provider.get_hotel_details("missing")

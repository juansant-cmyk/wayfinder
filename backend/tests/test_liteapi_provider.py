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
    "rates": [{"boardName": "Room Only", "name": "Queen"}],
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
    "tags": ["Pool", "Wi-Fi"],
}


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
    assert "Pool" in hotel.amenities
    assert hotel.metadata_json["offer_id"] == "offer-cheap"
    assert hotel.metadata_json["image_url"] == "https://example.com/hotel.jpg"


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
                "hotelFacilities": ["Pool", "Spa", "Wi-Fi"],
                "location": {"latitude": -8.34, "longitude": 115.09},
                "hotelImages": [{"url": "https://example.com/a.jpg", "defaultImage": True}],
            }
        }
    )
    assert hotel.provider_hotel_id == "lp1897"
    assert hotel.rating == 4.0
    assert hotel.amenities[:2] == ["Pool", "Spa"]
    assert hotel.metadata_json["description"] == "A lovely stay."
    assert hotel.metadata_json["image_url"] == "https://example.com/hotel.jpg"
    assert hotel.nightly_rate == 0.0


@pytest.mark.asyncio
async def test_liteapi_search_hotels_happy_path():
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/hotels/rates")
        assert request.headers.get("X-API-Key") == "test-key"
        return httpx.Response(
            200,
            json={
                "data": [SAMPLE_RATE_ROW],
                "hotels": [SAMPLE_HOTEL_INFO],
            },
        )

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as client:
        provider = LiteApiHotelProvider(client=client, api_key="test-key")
        hotels = await provider.search_hotels(
            "Bali", None, None, "2026-11-01", "2026-11-03", 2, "price"
        )

    assert len(hotels) == 1
    assert hotels[0].provider_hotel_id == "lp1897"
    assert hotels[0].metadata_json["check_in"] == "2026-11-01"
    assert hotels[0].metadata_json["check_out"] == "2026-11-03"


@pytest.mark.asyncio
async def test_liteapi_search_uses_geo_when_provided():
    captured: dict = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = request.read()
        return httpx.Response(200, json={"data": [], "hotels": []})

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

"""Deep integration tests — validate API responses against Pydantic schemas.

Each module test parses live HTTP JSON through the same models FastAPI uses
for response_model, catching missing fields, wrong types, and constraint
violations before they reach the mobile app.

Run: pytest -m integration -v
"""

from datetime import date

import pytest
from httpx import AsyncClient

from app.routers.geo import GeocodeResult
from app.schemas.auth import TokenResponse, UserResponse
from app.schemas.dashboard import (
    ChatMessageResponse,
    FavoriteItemResponse,
    FlightResponse,
    NotificationResponse,
    RecommendedDestinationResponse,
    SafetySummaryResponse,
    TravelCheckResponse,
    WeatherResponse,
)
from app.schemas.safety import SafetyReportResponse
from app.schemas.travel import (
    DismissAlertResponse,
    HotelResponse,
    PlaceResponse,
    SafetyFeedAlertResponse,
    TravelPlanDetailResponse,
    TravelPlanResponse,
)
from tests.schema_helpers import assert_json, parse_list, parse_one

pytestmark = [pytest.mark.integration, pytest.mark.usefixtures("stub_geocode")]

BALI_DEST = "Bali"
BALI_LAT = -8.34
BALI_LNG = 115.09


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_auth_register_and_login_match_token_schema(client: AsyncClient):
    register = assert_json(
        await client.post(
            "/auth/register",
            json={
                "email": "schema-register@example.com",
                "password": "password123",
                "full_name": "Schema User",
                "username": "schemauser",
            },
        ),
        status=201,
    )
    registered = parse_one(TokenResponse, register)
    assert registered.token_type == "bearer"
    assert registered.access_token
    assert registered.user.email == "schema-register@example.com"

    login = parse_one(
        TokenResponse,
        assert_json(
            await client.post(
                "/auth/login",
                json={"identity": "schema-register@example.com", "password": "password123"},
            )
        ),
    )
    assert login.user.username == "schemauser"


@pytest.mark.asyncio
async def test_auth_me_matches_user_schema(client: AsyncClient, auth_headers: dict[str, str]):
    user = parse_one(
        UserResponse,
        assert_json(await client.get("/auth/me", headers=auth_headers)),
    )
    assert user.full_name
    assert user.created_at


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_plans_match_travel_plan_schemas(client: AsyncClient, auth_headers: dict[str, str]):
    created = parse_one(
        TravelPlanDetailResponse,
        assert_json(
            await client.post(
                "/plans",
                headers=auth_headers,
                json={
                    "title": "Schema Trip",
                    "destination_name": "Bali, Indonesia",
                    "start_date": date(2026, 8, 1).isoformat(),
                    "end_date": date(2026, 8, 5).isoformat(),
                },
            ),
            status=201,
        ),
    )
    assert created.status in {"active", "completed"}
    assert created.day_count == 5
    assert len(created.days) == 5
    for day in created.days:
        assert day.label
        assert day.short_date

    listed = parse_list(
        TravelPlanResponse,
        assert_json(await client.get("/plans", headers=auth_headers)),
    )
    assert any(plan.id == created.id for plan in listed)

    detail = parse_one(
        TravelPlanDetailResponse,
        assert_json(await client.get(f"/plans/{created.id}", headers=auth_headers)),
    )
    assert detail.title == "Schema Trip"


# ---------------------------------------------------------------------------
# Hotels & flights
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_hotels_search_matches_hotel_schema(client: AsyncClient, auth_headers: dict[str, str]):
    hotels = parse_list(
        HotelResponse,
        assert_json(
            await client.get(f"/hotels/search?destination={BALI_DEST}", headers=auth_headers)
        ),
    )
    assert hotels
    hotel = hotels[0]
    assert hotel.provider
    assert hotel.nightly_rate >= 0
    assert hotel.currency
    assert isinstance(hotel.amenities, list)
    assert isinstance(hotel.metadata_json, dict)


@pytest.mark.asyncio
async def test_flights_search_matches_flight_schema(client: AsyncClient, auth_headers: dict[str, str]):
    flights = parse_list(
        FlightResponse,
        assert_json(
            await client.get(f"/flights/search?destination={BALI_DEST}", headers=auth_headers)
        ),
    )
    assert flights
    flight = flights[0]
    assert flight.airline
    assert flight.price >= 0
    assert flight.stops >= 0


# ---------------------------------------------------------------------------
# Favorites
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_favorites_match_favorite_item_schema(client: AsyncClient, auth_headers: dict[str, str]):
    empty = parse_list(
        FavoriteItemResponse,
        assert_json(await client.get("/favorites", headers=auth_headers)),
    )
    assert empty == []

    created = parse_one(
        FavoriteItemResponse,
        assert_json(
            await client.post(
                "/favorites",
                headers=auth_headers,
                json={
                    "item_type": "hotel",
                    "provider": "mock",
                    "provider_item_id": "schema-hotel-1",
                    "entity_id": "11111111-1111-1111-1111-111111111111",
                    "snapshot": {
                        "name": "Schema Hotel",
                        "price": 99,
                        "currency": "USD",
                        "rating": 4.2,
                        "address": "Bali",
                        "lat": BALI_LAT,
                        "lng": BALI_LNG,
                    },
                },
            ),
            status=201,
        ),
    )
    assert created.title == "Schema Hotel"
    assert isinstance(created.snapshot, dict)

    listed = parse_list(
        FavoriteItemResponse,
        assert_json(await client.get("/favorites", headers=auth_headers)),
    )
    assert len(listed) == 1


# ---------------------------------------------------------------------------
# Safety
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_safety_summary_and_report_match_schemas(
    client: AsyncClient, auth_headers: dict[str, str]
):
    summary = parse_one(
        SafetySummaryResponse,
        assert_json(
            await client.get(f"/safety/summary?destination={BALI_DEST}", headers=auth_headers)
        ),
    )
    assert summary.overall_level in {"low", "moderate", "high", "extreme"}
    for alert in summary.alerts:
        assert alert.title
        assert alert.severity

    report = parse_one(
        SafetyReportResponse,
        assert_json(
            await client.get(
                f"/safety/report?destination={BALI_DEST}&lat={BALI_LAT}&lng={BALI_LNG}",
                headers=auth_headers,
            )
        ),
    )
    assert 0 <= report.risk.score <= 5
    assert report.risk.level in {"low", "moderate", "high", "extreme"}
    assert report.coverage.country_iso
    for category in report.categories:
        assert category.id
        assert category.status
    for tip in report.tips:
        assert tip.title and tip.detail


@pytest.mark.asyncio
async def test_safety_feed_and_dismiss_match_schemas(
    client: AsyncClient, auth_headers: dict[str, str]
):
    alerts = parse_list(
        SafetyFeedAlertResponse,
        assert_json(
            await client.get(
                "/safety",
                params={
                    "destination": "Lisbon",
                    "lat": 38.7,
                    "lng": -9.1,
                    "country_iso": "PRT",
                },
                headers=auth_headers,
            )
        ),
    )
    assert alerts
    alert = alerts[0]
    assert alert.severity
    assert alert.description

    dismissed = parse_one(
        DismissAlertResponse,
        assert_json(
            await client.post(f"/safety/alerts/{alert.id}/dismiss", headers=auth_headers)
        ),
    )
    assert dismissed.status == "dismissed"
    assert dismissed.alert_id == alert.id


# ---------------------------------------------------------------------------
# Weather & travel check
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_weather_current_matches_weather_schema(
    client: AsyncClient, auth_headers: dict[str, str]
):
    weather = parse_one(
        WeatherResponse,
        assert_json(
            await client.get(f"/weather/current?destination={BALI_DEST}", headers=auth_headers)
        ),
    )
    assert weather.destination
    assert isinstance(weather.humidity, int)
    assert isinstance(weather.forecast_days, list)
    assert isinstance(weather.warnings, list)


@pytest.mark.asyncio
async def test_travel_check_matches_schema(client: AsyncClient, auth_headers: dict[str, str]):
    travel_check = parse_one(
        TravelCheckResponse,
        assert_json(
            await client.get(f"/travel-check?destination={BALI_DEST}", headers=auth_headers)
        ),
    )
    assert travel_check.summary
    assert travel_check.safety.destination
    assert travel_check.weather.temp_c is not None


# ---------------------------------------------------------------------------
# Destinations, places, geo, chat, notifications
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_destinations_match_recommended_schema(
    client: AsyncClient, auth_headers: dict[str, str]
):
    recommended = parse_list(
        RecommendedDestinationResponse,
        assert_json(await client.get("/destinations/recommended", headers=auth_headers)),
    )
    assert recommended
    assert recommended[0].slug

    destination = parse_one(
        RecommendedDestinationResponse,
        assert_json(await client.get("/destinations/bali", headers=auth_headers)),
    )
    assert destination.name == "Bali"


@pytest.mark.asyncio
async def test_places_popular_match_place_schema(client: AsyncClient, auth_headers: dict[str, str]):
    places = parse_list(
        PlaceResponse,
        assert_json(
            await client.get(
                "/places/popular",
                params={"lat": 40, "lng": -74, "radius_km": 5},
                headers=auth_headers,
            )
        ),
    )
    assert places
    place = places[0]
    assert place.provider_place_id
    assert isinstance(place.metadata_json, dict)


@pytest.mark.asyncio
async def test_geo_endpoints_match_geocode_schema(client: AsyncClient, auth_headers: dict[str, str]):
    reverse = parse_one(
        GeocodeResult,
        assert_json(
            await client.get(
                "/geo/reverse",
                params={"lat": BALI_LAT, "lng": BALI_LNG},
                headers=auth_headers,
            )
        ),
    )
    assert reverse.label

    search = parse_one(
        GeocodeResult,
        assert_json(
            await client.get("/geo/search", params={"q": BALI_DEST}, headers=auth_headers)
        ),
    )
    assert search.lat is not None

    suggestions = parse_list(
        GeocodeResult,
        assert_json(
            await client.get(
                "/geo/suggest", params={"q": BALI_DEST, "limit": 5}, headers=auth_headers
            )
        ),
    )
    assert suggestions


@pytest.mark.asyncio
async def test_chat_messages_match_schema(client: AsyncClient, auth_headers: dict[str, str]):
    chat = parse_one(
        ChatMessageResponse,
        assert_json(
            await client.post(
                "/chat/messages",
                headers=auth_headers,
                json={"message": "What is the weather like in Bali?"},
            )
        ),
    )
    assert chat.reply.strip()
    assert chat.session_id


@pytest.mark.asyncio
async def test_notifications_match_schema(client: AsyncClient, auth_headers: dict[str, str]):
    notifications = parse_list(
        NotificationResponse,
        assert_json(await client.get("/notifications", headers=auth_headers)),
    )
    assert notifications
    note = notifications[0]
    assert note.title
    assert isinstance(note.read, bool)

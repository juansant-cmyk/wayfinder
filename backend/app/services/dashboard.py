# Mock dashboard data — matches HomeScreen labels until external APIs are wired.
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.schemas.dashboard import (
    ChatMessageResponse,
    FlightResponse,
    NotificationResponse,
    RecommendedDestinationResponse,
    SafetyAlertResponse,
    SafetySummaryResponse,
    TravelCheckResponse,
    WeatherResponse,
)

RECOMMENDED_DESTINATIONS = [
    RecommendedDestinationResponse(
        name="Bali",
        subtitle="Indonesia",
        rating="4.8",
        image_url="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80",
        slug="bali",
    ),
    RecommendedDestinationResponse(
        name="Japan",
        subtitle="Culture • Food",
        rating="4.9",
        image_url="https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=600&q=80",
        slug="japan",
    ),
    RecommendedDestinationResponse(
        name="Switzerland",
        subtitle="Nature • Lakes",
        rating="4.7",
        image_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
        slug="switzerland",
    ),
    RecommendedDestinationResponse(
        name="Portugal",
        subtitle="Coastal • Cities",
        rating="4.6",
        image_url="https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=600&q=80",
        slug="portugal",
    ),
]


def list_recommended_destinations() -> list[RecommendedDestinationResponse]:
    return RECOMMENDED_DESTINATIONS


def get_recommended_destination(slug: str) -> RecommendedDestinationResponse:
    normalized = slug.strip().lower()
    for destination in RECOMMENDED_DESTINATIONS:
        if destination.slug == normalized:
            return destination
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination not found")


def search_flights(
    origin: str | None,
    destination: str | None,
    sort: str,
) -> list[FlightResponse]:
    from_code = (origin or "SFO").upper()
    to_name = destination or "Bali"
    flights = [
        FlightResponse(
            id="mock-flight-1",
            airline="Wayfinder Air",
            origin=from_code,
            destination=to_name,
            departure_at="2026-08-10T09:30:00Z",
            arrival_at="2026-08-10T22:15:00Z",
            price=642.0,
            stops=1,
        ),
        FlightResponse(
            id="mock-flight-2",
            airline="Pacific Jet",
            origin=from_code,
            destination=to_name,
            departure_at="2026-08-11T14:05:00Z",
            arrival_at="2026-08-12T03:40:00Z",
            price=589.0,
            stops=0,
        ),
    ]
    if sort == "price":
        return sorted(flights, key=lambda flight: flight.price)
    return flights


def get_safety_summary(destination: str | None) -> SafetySummaryResponse:
    target = destination or "Your destination"
    return SafetySummaryResponse(
        destination=target,
        overall_level="moderate",
        alerts=[
            SafetyAlertResponse(
                title="Travel advisory",
                severity="medium",
                summary=f"No major advisories reported for {target}. Stay aware in crowded areas.",
            ),
            SafetyAlertResponse(
                title="Neighborhood note",
                severity="low",
                summary="Tourist districts are generally safe during daytime hours.",
            ),
        ],
    )


def get_weather(destination: str | None) -> WeatherResponse:
    target = destination or "Your destination"
    return WeatherResponse(
        destination=target,
        temp_c=26.0,
        temp_f=78.8,
        condition="Partly cloudy",
        humidity=62,
        forecast_summary=f"Mild and breezy in {target} over the next 3 days.",
    )


def get_travel_check(destination: str | None) -> TravelCheckResponse:
    safety = get_safety_summary(destination)
    weather = get_weather(destination)
    return TravelCheckResponse(
        destination=safety.destination,
        safety=safety,
        weather=weather,
        summary=f"{weather.condition} with {safety.overall_level} safety conditions.",
    )


def list_notifications(user_id: UUID) -> list[NotificationResponse]:
    now = datetime.now(UTC)
    return [
        NotificationResponse(
            id=uuid4(),
            title="Trip reminder",
            body="Your Bali itinerary starts in 2 weeks.",
            read=False,
            created_at=now - timedelta(hours=2),
        ),
        NotificationResponse(
            id=uuid4(),
            title="Price update",
            body="Hotel rates in Japan dropped 8% since yesterday.",
            read=True,
            created_at=now - timedelta(days=1),
        ),
    ]


def send_chat_message(user_id: UUID, message: str) -> ChatMessageResponse:
    """Deprecated sync stub — prefer ``app.services.chat.send_chat_message`` (async)."""
    return ChatMessageResponse(
        reply=(
            "I'm Wayfinder. For now this is a mock reply — "
            f'you asked: "{message.strip()}". Try asking about destinations, hotels, or safety.'
        ),
        session_id=str(user_id),
        provider="legacy-dashboard",
        agent=None,
    )

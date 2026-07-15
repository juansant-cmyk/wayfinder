from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RecommendedDestinationResponse(BaseModel):
    name: str
    subtitle: str
    rating: str
    image_url: str
    slug: str


class FlightResponse(BaseModel):
    id: str
    airline: str
    origin: str
    destination: str
    departure_at: str
    arrival_at: str
    price: float
    currency: str = "USD"
    stops: int = 0


class FavoriteSnapshot(BaseModel):
    """Hybrid card fields stored on heart (P3: card + lat/lng)."""

    name: str
    price: float | None = None
    currency: str | None = None
    rating: float | None = None
    address: str | None = None
    image_url: str | None = None
    subtitle: str | None = None
    lat: float | None = None
    lng: float | None = None


class FavoriteCreateRequest(BaseModel):
    item_type: str = Field(min_length=1, max_length=50)
    provider: str = Field(min_length=1, max_length=50)
    provider_item_id: str = Field(min_length=1, max_length=255)
    entity_id: UUID | None = None
    snapshot: FavoriteSnapshot


class FavoriteItemResponse(BaseModel):
    id: UUID
    item_type: str
    provider: str
    provider_item_id: str
    entity_id: UUID | None = None
    title: str
    subtitle: str | None = None
    image_url: str | None = None
    price: float | None = None
    currency: str | None = None
    rating: float | None = None
    address: str | None = None
    lat: float | None = None
    lng: float | None = None
    saved_at: datetime
    snapshot: dict = Field(default_factory=dict)


class SafetyAlertResponse(BaseModel):
    title: str
    severity: str
    summary: str


class SafetySummaryResponse(BaseModel):
    destination: str
    overall_level: str
    alerts: list[SafetyAlertResponse]


class WeatherResponse(BaseModel):
    destination: str
    temp_c: float
    temp_f: float
    condition: str
    humidity: int
    forecast_summary: str


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class ChatMessageResponse(BaseModel):
    reply: str
    session_id: str


class NotificationResponse(BaseModel):
    id: UUID
    title: str
    body: str
    read: bool
    created_at: datetime


class TravelCheckResponse(BaseModel):
    destination: str
    safety: SafetySummaryResponse
    weather: WeatherResponse
    summary: str

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


class FavoriteItemResponse(BaseModel):
    id: UUID
    item_type: str
    title: str
    subtitle: str | None = None
    image_url: str | None = None
    saved_at: datetime


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

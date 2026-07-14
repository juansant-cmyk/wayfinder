from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TravelPlanBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    destination_name: str = Field(min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    center_lat: float | None = Field(default=None, ge=-90, le=90)
    center_lng: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float = Field(default=5, ge=1, le=25)
    budget_min: float | None = Field(default=None, ge=0)
    budget_max: float | None = Field(default=None, ge=0)
    traveler_count: int = Field(default=1, ge=1, le=20)

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if self.budget_min is not None and self.budget_max is not None and self.budget_max < self.budget_min:
            raise ValueError("budget_max must be greater than or equal to budget_min")
        return self


class TravelPlanCreate(TravelPlanBase):
    pass


class TravelPlanUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    destination_name: str | None = Field(default=None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    center_lat: float | None = Field(default=None, ge=-90, le=90)
    center_lng: float | None = Field(default=None, ge=-180, le=180)
    radius_km: float | None = Field(default=None, ge=1, le=25)
    budget_min: float | None = Field(default=None, ge=0)
    budget_max: float | None = Field(default=None, ge=0)
    traveler_count: int | None = Field(default=None, ge=1, le=20)


class TravelPlanResponse(TravelPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class PlaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    provider_place_id: str
    name: str
    category: str
    address: str | None
    lat: float
    lng: float
    rating: float | None
    popularity_score: float
    metadata_json: dict
    distance_km: float | None = None


class HotelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    provider_hotel_id: str
    name: str
    address: str | None
    lat: float | None
    lng: float | None
    nightly_rate: float
    total_estimate: float
    currency: str
    amenities: list[str]
    rating: float | None
    metadata_json: dict
    distance_miles: float | None = None


class ChatSessionCreate(BaseModel):
    title: str = Field(default="Travel chat", min_length=1, max_length=120)


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    created_at: datetime
    updated_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: UUID
    role: str
    content: str
    created_at: datetime


class ChatTurnResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class SafetyFeedAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    source: str
    destination: str
    alert_type: str
    severity: str
    title: str
    description: str
    lat: float | None
    lng: float | None
    starts_at: datetime | None
    ends_at: datetime | None
    created_at: datetime


class DismissAlertResponse(BaseModel):
    alert_id: UUID
    status: str = "dismissed"


class FareWatchCreate(BaseModel):
    watch_type: Literal["hotel", "route"]
    origin: str | None = Field(default=None, max_length=120)
    destination: str = Field(min_length=1, max_length=120)
    hotel_id: UUID | None = None
    target_price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    @model_validator(mode="after")
    def validate_watch(self):
        if self.watch_type == "route" and not self.origin:
            raise ValueError("origin is required for route fare watches")
        if self.watch_type == "hotel" and self.hotel_id is None:
            raise ValueError("hotel_id is required for hotel fare watches")
        return self


class FareWatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    watch_type: str
    origin: str | None
    destination: str
    hotel_id: UUID | None
    target_price: float | None
    currency: str
    created_at: datetime
    updated_at: datetime


class FareEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    watch_id: UUID
    price: float
    currency: str
    provider: str
    observed_at: datetime
    metadata_json: dict

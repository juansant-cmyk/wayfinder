from datetime import date, datetime, timedelta
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_TRIP_INCLUSIVE_DAYS = 14
DEFAULT_CHECK_IN_TIME = "3:00 PM"
DEFAULT_CHECK_OUT_TIME = "11:00 AM"


def inclusive_day_count(start: date, end: date) -> int:
    return (end - start).days + 1


def night_count(start: date, end: date) -> int:
    return (end - start).days


def validate_trip_date_range(start: date | None, end: date | None) -> None:
    if start is None or end is None:
        raise ValueError("start_date and end_date are required")
    if end < start:
        raise ValueError("end_date must be on or after start_date")
    days = inclusive_day_count(start, end)
    if days > MAX_TRIP_INCLUSIVE_DAYS:
        raise ValueError(f"Trips can span at most {MAX_TRIP_INCLUSIVE_DAYS} days")


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
    hotel_name: str | None = Field(default=None, max_length=255)
    hotel_provider: str | None = Field(default=None, max_length=50)
    hotel_provider_id: str | None = Field(default=None, max_length=255)
    cover_image_url: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.start_date is not None or self.end_date is not None:
            validate_trip_date_range(self.start_date, self.end_date)
        if (
            self.budget_min is not None
            and self.budget_max is not None
            and self.budget_max < self.budget_min
        ):
            raise ValueError("budget_max must be greater than or equal to budget_min")
        return self


class TravelPlanCreate(TravelPlanBase):
    start_date: date
    end_date: date


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
    hotel_name: str | None = Field(default=None, max_length=255)
    hotel_provider: str | None = Field(default=None, max_length=50)
    hotel_provider_id: str | None = Field(default=None, max_length=255)
    cover_image_url: str | None = Field(default=None, max_length=1000)
    status: str | None = Field(default=None, pattern="^(active|completed)$")


class PlanActivityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    day_id: UUID
    kind: str
    time_label: str
    title: str
    location: str | None
    category: str
    tag_label: str | None
    lat: float | None
    lng: float | None
    sort_index: int


class PlanDayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    day_date: date
    sort_index: int
    label: str
    short_date: str
    full_date: str
    activities: list[PlanActivityResponse] = Field(default_factory=list)


class TravelPlanResponse(TravelPlanBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    status: str = "active"
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    nights: int | None = None
    day_count: int | None = None


class TravelPlanDetailResponse(TravelPlanResponse):
    days: list[PlanDayResponse] = Field(default_factory=list)


class PlanActivityCreate(BaseModel):
    time_label: str = Field(min_length=1, max_length=32)
    title: str = Field(min_length=1, max_length=255)
    location: str = Field(min_length=1, max_length=255)
    category: str = Field(default="food", max_length=40)
    tag_label: str | None = Field(default=None, max_length=120)


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


def iter_trip_dates(start: date, end: date) -> list[date]:
    validate_trip_date_range(start, end)
    return [start + timedelta(days=offset) for offset in range(inclusive_day_count(start, end))]


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
    headline: str | None = None
    urgency: str | None = None
    areas: str | None = None
    event: str | None = None
    effective: datetime | None = None
    expires: datetime | None = None
    desc: str | None = None
    instruction: str | None = None


class DismissAlertResponse(BaseModel):
    alert_id: UUID
    status: str = "dismissed"

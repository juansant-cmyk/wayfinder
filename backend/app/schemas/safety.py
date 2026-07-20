from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.dashboard import WeatherResponse
from app.schemas.travel import SafetyFeedAlertResponse


class SafetyLocationResponse(BaseModel):
    label: str
    city: str | None = None
    lat: float | None = None
    lng: float | None = None


class SafetyCoverageResponse(BaseModel):
    country_name: str
    country_iso: str
    granularity: str = "country"


class SafetyRiskResponse(BaseModel):
    score: float = Field(ge=0, le=5)
    max_score: float = 5.0
    level: str
    advisory_level: int | None = None
    advisory_description: str | None = None
    advisory_date: datetime | None = None
    updated_at: datetime | None = None


class SafetyCategoryResponse(BaseModel):
    id: str
    title: str
    status: str
    description: str
    source: str


class SafetyTipResponse(BaseModel):
    id: str
    title: str
    description: str
    detail: str
    source: str = "Wayfinder general preparedness guidance"
    alert_type: str | None = None


class SafetyReportResponse(BaseModel):
    location: SafetyLocationResponse
    coverage: SafetyCoverageResponse
    risk: SafetyRiskResponse
    alerts: list[SafetyFeedAlertResponse] = Field(default_factory=list)
    categories: list[SafetyCategoryResponse] = Field(default_factory=list)
    tips: list[SafetyTipResponse] = Field(default_factory=list)
    weather: WeatherResponse | None = None
    sources: list[str] = Field(default_factory=list)
    fetched_at: datetime
    is_stale: bool = False

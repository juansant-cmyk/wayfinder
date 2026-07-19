from dataclasses import dataclass, field
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class ProviderPlace:
    provider: str
    provider_place_id: str
    name: str
    category: str
    address: str | None
    lat: float
    lng: float
    rating: float | None
    popularity_score: float
    metadata_json: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ProviderHotel:
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
    metadata_json: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ProviderSafetyAlert:
    source: str
    destination: str
    alert_type: str
    severity: str
    title: str
    description: str
    lat: float | None = None
    lng: float | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    headline: str | None = None
    urgency: str | None = None
    areas: str | None = None
    event: str | None = None
    instruction: str | None = None


@dataclass(frozen=True)
class ProviderAirQuality:
    co: float | None = None
    no2: float | None = None
    o3: float | None = None
    so2: float | None = None
    pm2_5: float | None = None
    pm10: float | None = None
    us_epa_index: int | None = None
    gb_defra_index: int | None = None


@dataclass(frozen=True)
class ProviderForecastDay:
    date: str
    max_temp_c: float | None
    min_temp_c: float | None
    avg_temp_c: float | None
    max_temp_f: float | None
    min_temp_f: float | None
    avg_temp_f: float | None
    condition: str | None
    icon_url: str | None
    chance_of_rain: int | None
    chance_of_snow: int | None
    uv: float | None


@dataclass(frozen=True)
class ProviderForecastHour:
    time: str
    temp_c: float | None
    temp_f: float | None
    condition: str | None
    icon_url: str | None
    wind_kph: float | None
    chance_of_rain: int | None
    is_day: bool | None = None


@dataclass(frozen=True)
class ProviderCurrentWeather:
    destination: str
    temp_c: float
    temp_f: float
    condition: str
    humidity: int
    forecast_summary: str
    icon_url: str | None = None
    is_day: bool | None = None
    wind_mph: float | None = None
    wind_kph: float | None = None
    wind_dir: str | None = None
    gust_mph: float | None = None
    pressure_mb: float | None = None
    precip_mm: float | None = None
    feelslike_c: float | None = None
    feelslike_f: float | None = None
    uv: float | None = None
    visibility_miles: float | None = None
    cloud: int | None = None
    localtime: str | None = None
    sunrise: str | None = None
    sunset: str | None = None
    provider: str = "mock"
    air_quality: ProviderAirQuality | None = None
    forecast_days: list[ProviderForecastDay] = field(default_factory=list)
    forecast_hours: list[ProviderForecastHour] = field(default_factory=list)
    warnings: list[ProviderSafetyAlert] = field(default_factory=list)


class PlacesProvider(Protocol):
    async def popular_places(
        self, lat: float, lng: float, radius_km: float, category: str | None, limit: int
    ) -> list[ProviderPlace]:
        ...


class HotelProvider(Protocol):
    """External hotel source adapter.

    ``hotel_id`` on detail calls is the *provider* id (e.g. LiteAPI hotelId),
    not Wayfinder's internal UUID.
    """

    async def search_hotels(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
        check_in: str | None,
        check_out: str | None,
        guests: int,
        sort: str,
        guest_nationality: str | None = None,
        currency: str | None = None,
    ) -> list[ProviderHotel]:
        """Return ranked search hits for a destination or lat/lng pin.

        ``guest_nationality`` (ISO-3166-1 alpha-2) and ``currency`` (ISO-4217)
        are per-request market hints for live providers; mocks may ignore them.
        """
        ...

    async def get_hotel_details(self, hotel_id: str) -> ProviderHotel:
        """Return essential details for one hotel by provider hotel id.

        Includes identity, location, amenities, rating, and any content the
        vendor exposes (images/description live in ``metadata_json``).
        Live rates may be absent or zero when dates were not supplied; callers
        that need priced offers should use ``search_hotels`` (or a future
        rates method) with check-in/out.
        """
        ...


class WeatherProvider(Protocol):
    async def alerts(
        self, lat: float | None, lng: float | None, destination: str
    ) -> list[ProviderSafetyAlert]:
        ...


class CurrentWeatherProvider(Protocol):
    async def current_weather(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
    ) -> ProviderCurrentWeather:
        ...


@dataclass(frozen=True)
class ChatToolSpec:
    """JSON-schema tool the orchestrator may expose to a chat model."""

    name: str
    description: str
    parameters: dict = field(default_factory=dict)


@dataclass(frozen=True)
class ChatMessage:
    role: str  # system | user | assistant | tool
    content: str
    name: str | None = None
    tool_call_id: str | None = None


@dataclass(frozen=True)
class ChatCompletion:
    content: str
    provider: str
    model: str
    tool_calls: list[dict] = field(default_factory=list)
    raw: dict = field(default_factory=dict)


class ChatProvider(Protocol):
    """Primary chat / agent brain (OpenAI by default for tools + subagents)."""

    name: str

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        tools: list[ChatToolSpec] | None = None,
    ) -> ChatCompletion:
        ...


class NarratorProvider(Protocol):
    """Optional prose layer (e.g. Claude Sonnet) over scored context."""

    name: str

    async def narrate(self, system: str, user: str) -> str:
        ...

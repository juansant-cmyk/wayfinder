from dataclasses import replace
from uuid import UUID

from app.providers.base import (
    ProviderAirQuality,
    ProviderCurrentWeather,
    ProviderFareEvent,
    ProviderForecastDay,
    ProviderForecastHour,
    ProviderHotel,
    ProviderPlace,
    ProviderSafetyAlert,
)
from app.services.hotel_sort import sort_provider_hotels

DEFAULT_CENTER_LAT = -8.3405
DEFAULT_CENTER_LNG = 115.092


class MockPlacesProvider:
    async def popular_places(
        self, lat: float, lng: float, radius_km: float, category: str | None, limit: int
    ) -> list[ProviderPlace]:
        places = [
            ProviderPlace(
                provider="mock",
                provider_place_id=f"mock-place-{category or 'popular'}-1",
                name="Central Market",
                category=category or "attraction",
                address="100 Market Street",
                lat=lat + 0.01,
                lng=lng + 0.01,
                rating=4.7,
                popularity_score=96,
                metadata_json={"radius_km": radius_km, "tags": ["food", "local"]},
            ),
            ProviderPlace(
                provider="mock",
                provider_place_id=f"mock-place-{category or 'popular'}-2",
                name="Riverfront Walk",
                category=category or "outdoors",
                address="Riverfront District",
                lat=lat - 0.01,
                lng=lng - 0.01,
                rating=4.5,
                popularity_score=88,
                metadata_json={"radius_km": radius_km, "tags": ["scenic", "free"]},
            ),
        ]
        return places[:limit]


class MockHotelProvider:
    def _catalog(
        self,
        destination: str | None = None,
        *,
        guests: int = 1,
        check_in: str | None = None,
        check_out: str | None = None,
    ) -> list[ProviderHotel]:
        location = destination or "Selected area"
        slug = location.lower().replace(" ", "-")
        return [
            ProviderHotel(
                provider="mock",
                provider_hotel_id=f"mock-hotel-{slug}-1",
                name=f"{location} Garden Hotel",
                address=f"12 Main Street, {location}",
                lat=DEFAULT_CENTER_LAT + 0.005,
                lng=DEFAULT_CENTER_LNG + 0.005,
                nightly_rate=149.0,
                total_estimate=298.0,
                currency="USD",
                amenities=["Pool", "Parking", "Gym", "Wi-Fi included", "Free cancellation"],
                rating=4.4,
                metadata_json={
                    "guests": guests,
                    "check_in": check_in,
                    "check_out": check_out,
                    "image_url": None,
                    "description": f"A garden-side stay in {location}.",
                    "cancellation": "Free cancellation",
                    "check_in_time": "3:00 PM",
                    "check_out_time": "11:00 AM",
                },
            ),
            ProviderHotel(
                provider="mock",
                provider_hotel_id=f"mock-hotel-{slug}-2",
                name=f"{location} Central Stay",
                address=f"45 Center Avenue, {location}",
                lat=DEFAULT_CENTER_LAT + 0.03,
                lng=DEFAULT_CENTER_LNG + 0.03,
                nightly_rate=119.0,
                total_estimate=238.0,
                currency="USD",
                amenities=["Parking", "Wi-Fi included", "Non-refundable"],
                rating=4.1,
                metadata_json={
                    "guests": guests,
                    "check_in": check_in,
                    "check_out": check_out,
                    "image_url": None,
                    "description": f"A central base in {location}.",
                    "cancellation": "Non-refundable",
                },
            ),
        ]

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
        hotels = self._catalog(destination, guests=guests, check_in=check_in, check_out=check_out)
        if guest_nationality or currency:
            hotels = [
                replace(
                    hotel,
                    currency=currency or hotel.currency,
                    metadata_json={
                        **hotel.metadata_json,
                        "guest_nationality": guest_nationality,
                        "request_currency": currency,
                    },
                )
                for hotel in hotels
            ]
        return sort_provider_hotels(hotels, sort, lat, lng)

    async def get_hotel_details(self, hotel_id: str) -> ProviderHotel:
        # Mock ids embed the destination slug; rebuild a small catalog from it.
        # e.g. mock-hotel-bali-1 → destination "Bali"
        parts = hotel_id.removeprefix("mock-hotel-").rsplit("-", 1)
        destination = parts[0].replace("-", " ").title() if parts else "Selected Area"
        for hotel in self._catalog(destination):
            if hotel.provider_hotel_id == hotel_id:
                return hotel
        for place in ("Bali", "Paris", "Japan", "Selected area"):
            for hotel in self._catalog(place):
                if hotel.provider_hotel_id == hotel_id:
                    return hotel
        raise LookupError(f"Mock hotel not found: {hotel_id}")


class MockWeatherProvider:
    async def current_weather(
        self,
        destination: str | None,
        lat: float | None,
        lng: float | None,
    ) -> ProviderCurrentWeather:
        target = destination or (
            f"{lat},{lng}" if lat is not None and lng is not None else "Selected location"
        )
        warning = ProviderSafetyAlert(
            source="mock-weather",
            destination=target,
            alert_type="weather",
            severity="moderate",
            title=f"Rain likely near {target}",
            description="Carry rain gear and allow extra travel time.",
            lat=lat,
            lng=lng,
        )
        return ProviderCurrentWeather(
            destination=target,
            temp_c=26.0,
            temp_f=78.8,
            condition="Partly cloudy",
            humidity=62,
            forecast_summary=f"Mild and breezy in {target} over the next 3 days.",
            icon_url="https://cdn.weatherapi.com/weather/64x64/day/116.png",
            is_day=True,
            wind_mph=7.5,
            wind_kph=12.1,
            wind_dir="E",
            gust_mph=10.0,
            pressure_mb=1012.0,
            precip_mm=0.2,
            feelslike_c=27.0,
            feelslike_f=80.6,
            uv=6.0,
            visibility_miles=6.0,
            cloud=35,
            localtime=None,
            provider="mock",
            air_quality=ProviderAirQuality(us_epa_index=1, gb_defra_index=1),
            forecast_days=[
                ProviderForecastDay(
                    date="2026-08-10",
                    max_temp_c=28.0,
                    min_temp_c=23.0,
                    avg_temp_c=25.5,
                    max_temp_f=82.4,
                    min_temp_f=73.4,
                    avg_temp_f=77.9,
                    condition="Partly cloudy",
                    icon_url="https://cdn.weatherapi.com/weather/64x64/day/116.png",
                    chance_of_rain=25,
                    chance_of_snow=0,
                    uv=6.0,
                )
            ],
            warnings=[warning],
        )

    async def alerts(
        self, lat: float | None, lng: float | None, destination: str
    ) -> list[ProviderSafetyAlert]:
        report = await self.current_weather(destination, lat, lng)
        return report.warnings


class MockTravelAdvisoryProvider:
    async def alerts(self, destination: str) -> list[ProviderSafetyAlert]:
        return [
            ProviderSafetyAlert(
                source="mock-advisory",
                destination=destination,
                alert_type="advisory",
                severity="low",
                title=f"Standard travel precautions for {destination}",
                description="Keep valuables secure and monitor local guidance.",
            )
        ]


class MockFareProvider:
    async def latest_price(
        self,
        watch_type: str,
        origin: str | None,
        destination: str,
        hotel_id: UUID | None,
        currency: str,
    ) -> ProviderFareEvent:
        base_price = 180.0 if watch_type == "route" else 129.0
        return ProviderFareEvent(
            price=base_price,
            currency=currency,
            provider="mock",
            metadata_json={
                "origin": origin,
                "destination": destination,
                "hotel_id": str(hotel_id) if hotel_id else None,
            },
        )


class MockLLMProvider:
    async def answer(self, message: str, favorites: list[dict], plans: list[dict]) -> str:
        context_bits = []
        if favorites:
            context_bits.append(f"{len(favorites)} saved favorites")
        if plans:
            context_bits.append(f"{len(plans)} active travel plans")
        context = " using " + " and ".join(context_bits) if context_bits else ""
        return f"mock reply from Wayfinder{context}: {message.strip()}"

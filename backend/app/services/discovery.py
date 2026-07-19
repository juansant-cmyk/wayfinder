from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.travel import Place
from app.providers.base import PlacesProvider, ProviderPlace
from app.providers.google_places import GooglePlacesMissingKey, GooglePlacesUnavailable
from app.providers.mock import MockPlacesProvider
from app.schemas.travel import PlaceResponse
from app.services.geo import haversine_km


async def _upsert_place(db: AsyncSession, item: ProviderPlace) -> Place:
    result = await db.execute(
        select(Place).where(
            Place.provider == item.provider,
            Place.provider_place_id == item.provider_place_id,
        )
    )
    place = result.scalar_one_or_none()
    fields = {
        "name": item.name,
        "category": item.category,
        "address": item.address,
        "lat": item.lat,
        "lng": item.lng,
        "rating": item.rating,
        "popularity_score": item.popularity_score,
        "metadata_json": item.metadata_json,
    }
    if place is None:
        place = Place(
            provider=item.provider,
            provider_place_id=item.provider_place_id,
            **fields,
        )
        db.add(place)
    else:
        for key, value in fields.items():
            setattr(place, key, value)
    await db.flush()
    return place


def place_to_response(place: Place, origin_lat: float, origin_lng: float) -> PlaceResponse:
    distance_km = round(haversine_km(origin_lat, origin_lng, place.lat, place.lng), 2)
    return PlaceResponse(
        id=place.id,
        provider=place.provider,
        provider_place_id=place.provider_place_id,
        name=place.name,
        category=place.category,
        address=place.address,
        lat=place.lat,
        lng=place.lng,
        rating=place.rating,
        popularity_score=place.popularity_score,
        metadata_json=place.metadata_json,
        distance_km=distance_km,
    )


async def popular_places(
    db: AsyncSession,
    provider: PlacesProvider,
    lat: float,
    lng: float,
    radius_km: float,
    category: str | None,
    limit: int,
) -> list[PlaceResponse]:
    try:
        provider_places = await provider.popular_places(lat, lng, radius_km, category, limit)
    except GooglePlacesMissingKey as exc:
        if not settings.use_mock_providers:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GOOGLE_MAPS_API_KEY is required for Google Places",
            ) from exc
        provider_places = await MockPlacesProvider().popular_places(
            lat, lng, radius_km, category, limit
        )
    except GooglePlacesUnavailable as exc:
        if not settings.use_mock_providers:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Places provider unavailable",
            ) from exc
        provider_places = await MockPlacesProvider().popular_places(
            lat, lng, radius_km, category, limit
        )
    places = [await _upsert_place(db, item) for item in provider_places]
    await db.commit()
    for place in places:
        await db.refresh(place)

    sorted_places = sorted(
        places,
        key=lambda place: haversine_km(lat, lng, place.lat, place.lng),
    )
    return [place_to_response(place, lat, lng) for place in sorted_places[:limit]]


async def get_place(db: AsyncSession, place_id: UUID) -> Place:
    place = await db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return place

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import Place
from app.providers.base import PlacesProvider, ProviderPlace


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


async def popular_places(
    db: AsyncSession,
    provider: PlacesProvider,
    lat: float,
    lng: float,
    radius_km: float,
    category: str | None,
    limit: int,
) -> list[Place]:
    provider_places = await provider.popular_places(lat, lng, radius_km, category, limit)
    places = [await _upsert_place(db, item) for item in provider_places]
    await db.commit()
    for place in places:
        await db.refresh(place)
    return places


async def get_place(db: AsyncSession, place_id: UUID) -> Place:
    place = await db.get(Place, place_id)
    if place is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found")
    return place

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import Hotel
from app.providers.base import HotelProvider, ProviderHotel


async def _upsert_hotel(db: AsyncSession, item: ProviderHotel) -> Hotel:
    result = await db.execute(
        select(Hotel).where(
            Hotel.provider == item.provider,
            Hotel.provider_hotel_id == item.provider_hotel_id,
        )
    )
    hotel = result.scalar_one_or_none()
    fields = {
        "name": item.name,
        "address": item.address,
        "lat": item.lat,
        "lng": item.lng,
        "nightly_rate": item.nightly_rate,
        "total_estimate": item.total_estimate,
        "currency": item.currency,
        "amenities": item.amenities,
        "rating": item.rating,
        "metadata_json": item.metadata_json,
    }
    if hotel is None:
        hotel = Hotel(
            provider=item.provider,
            provider_hotel_id=item.provider_hotel_id,
            **fields,
        )
        db.add(hotel)
    else:
        for key, value in fields.items():
            setattr(hotel, key, value)
    await db.flush()
    return hotel


async def search_hotels(
    db: AsyncSession,
    provider: HotelProvider,
    destination: str | None,
    lat: float | None,
    lng: float | None,
    check_in: str | None,
    check_out: str | None,
    guests: int,
    sort: str,
) -> list[Hotel]:
    provider_hotels = await provider.search_hotels(
        destination, lat, lng, check_in, check_out, guests, sort
    )
    hotels = [await _upsert_hotel(db, item) for item in provider_hotels]
    await db.commit()
    for hotel in hotels:
        await db.refresh(hotel)
    return hotels


async def get_hotel(db: AsyncSession, hotel_id: UUID) -> Hotel:
    hotel = await db.get(Hotel, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return hotel

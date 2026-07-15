from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import Hotel
from app.providers.base import HotelProvider, ProviderHotel
from app.schemas.travel import HotelResponse
from app.services.geo import haversine_miles
from app.services.hotel_sort import sort_hotels


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


def hotel_to_response(
    hotel: Hotel,
    origin_lat: float | None = None,
    origin_lng: float | None = None,
) -> HotelResponse:
    distance_miles = None
    if (
        origin_lat is not None
        and origin_lng is not None
        and hotel.lat is not None
        and hotel.lng is not None
    ):
        distance_miles = round(haversine_miles(origin_lat, origin_lng, hotel.lat, hotel.lng), 1)

    return HotelResponse(
        id=hotel.id,
        provider=hotel.provider,
        provider_hotel_id=hotel.provider_hotel_id,
        name=hotel.name,
        address=hotel.address,
        lat=hotel.lat,
        lng=hotel.lng,
        nightly_rate=hotel.nightly_rate,
        total_estimate=hotel.total_estimate,
        currency=hotel.currency,
        amenities=hotel.amenities,
        rating=hotel.rating,
        metadata_json=hotel.metadata_json,
        distance_miles=distance_miles,
    )


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
    guest_nationality: str | None = None,
    currency: str | None = None,
) -> list[Hotel]:
    provider_hotels = await provider.search_hotels(
        destination,
        lat,
        lng,
        check_in,
        check_out,
        guests,
        sort,
        guest_nationality=guest_nationality,
        currency=currency,
    )
    hotels = [await _upsert_hotel(db, item) for item in provider_hotels]
    await db.commit()
    for hotel in hotels:
        await db.refresh(hotel)
    return sort_hotels(hotels, sort, lat, lng)


async def get_hotel(db: AsyncSession, hotel_id: UUID) -> Hotel:
    hotel = await db.get(Hotel, hotel_id)
    if hotel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hotel not found")
    return hotel

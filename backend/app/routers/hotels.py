from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import HotelProvider
from app.providers.registry import get_hotel_provider
from app.routers.auth import get_current_user
from app.schemas.travel import HotelResponse
from app.services import hotels as hotel_service

router = APIRouter(prefix="/hotels", tags=["hotels"])


@router.get("/search", response_model=list[HotelResponse])
async def search_hotels(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: Annotated[HotelProvider, Depends(get_hotel_provider)],
    destination: str | None = Query(default=None, max_length=255),
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    check_in: date | None = None,
    check_out: date | None = None,
    guests: int = Query(default=1, ge=1, le=20),
    sort: str = Query(default="price", pattern="^(price|rating|distance)$"),
):
    if not destination and (lat is None or lng is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="destination or lat/lng is required",
        )
    if sort == "distance" and (lat is None or lng is None):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="lat and lng are required when sort=distance",
        )
    if check_in and check_out and check_out < check_in:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="check_out must be on or after check_in",
        )
    hotels = await hotel_service.search_hotels(
        db,
        provider,
        destination,
        lat,
        lng,
        check_in.isoformat() if check_in else None,
        check_out.isoformat() if check_out else None,
        guests,
        sort,
    )
    return [hotel_service.hotel_to_response(hotel, lat, lng) for hotel in hotels]


@router.get("/{hotel_id}", response_model=HotelResponse)
async def get_hotel(
    hotel_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await hotel_service.get_hotel(db, hotel_id)

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.providers.base import PlacesProvider
from app.providers.registry import get_places_provider
from app.schemas.travel import PlaceResponse
from app.services import discovery as discovery_service

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/popular", response_model=list[PlaceResponse])
async def popular_places(
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: Annotated[PlacesProvider, Depends(get_places_provider)],
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_km: float = Query(ge=1, le=25),
    category: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=10, ge=1, le=50),
):
    return await discovery_service.popular_places(
        db, provider, lat, lng, radius_km, category, limit
    )


@router.get("/{place_id}", response_model=PlaceResponse)
async def get_place(place_id: UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    return await discovery_service.get_place(db, place_id)

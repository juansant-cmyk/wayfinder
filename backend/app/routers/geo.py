from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.models.user import User
from app.routers.auth import get_current_user
from app.services import geocode as geocode_service

router = APIRouter(prefix="/geo", tags=["geo"])


class GeocodeResult(BaseModel):
    label: str
    city: str | None = None
    region: str | None = None
    country: str | None = None
    country_code: str | None = None
    country_iso: str | None = None
    lat: float
    lng: float
    provider: str | None = None


@router.get("/reverse", response_model=GeocodeResult)
async def reverse_geocode(
    lat: Annotated[float, Query(ge=-90, le=90)],
    lng: Annotated[float, Query(ge=-180, le=180)],
    _current_user: Annotated[User, Depends(get_current_user)],
):
    result = await geocode_service.reverse_geocode(lat, lng)
    if result is None or result.get("lat") is None or result.get("lng") is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Could not resolve a city for those coordinates",
        )
    return GeocodeResult(
        label=str(result["label"]),
        city=result.get("city"),
        region=result.get("region"),
        country=result.get("country"),
        country_code=result.get("country_code"),
        country_iso=result.get("country_iso"),
        lat=float(result["lat"]),
        lng=float(result["lng"]),
        provider=result.get("provider"),
    )


@router.get("/search", response_model=GeocodeResult)
async def search_geocode(
    q: Annotated[str, Query(min_length=1, max_length=255)],
    _current_user: Annotated[User, Depends(get_current_user)],
):
    result = await geocode_service.search_geocode(q)
    if result is None or result.get("lat") is None or result.get("lng") is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No results found for {q}. Please enter a valid location.",
        )
    return GeocodeResult(
        label=str(result.get("label") or q),
        city=result.get("city"),
        region=result.get("region"),
        country=result.get("country"),
        country_code=result.get("country_code"),
        country_iso=result.get("country_iso"),
        lat=float(result["lat"]),
        lng=float(result["lng"]),
        provider=result.get("provider"),
    )


@router.get("/suggest", response_model=list[GeocodeResult])
async def suggest_geocode(
    q: Annotated[str, Query(min_length=1, max_length=255)],
    _current_user: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=5)] = 5,
):
    results = await geocode_service.suggest_geocode(q, limit=limit)
    return [
        GeocodeResult(
            label=str(item.get("label") or q),
            city=item.get("city"),
            region=item.get("region"),
            country=item.get("country"),
            country_code=item.get("country_code"),
            country_iso=item.get("country_iso"),
            lat=float(item["lat"]),
            lng=float(item["lng"]),
            provider=item.get("provider"),
        )
        for item in results
        if item.get("lat") is not None and item.get("lng") is not None
    ]

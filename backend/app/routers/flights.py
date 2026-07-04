from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import FlightResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/flights", tags=["flights"])


@router.get("/search", response_model=list[FlightResponse])
async def search_flights(
    current_user: Annotated[User, Depends(get_current_user)],
    origin: str | None = Query(default=None, max_length=10),
    destination: str | None = Query(default=None, max_length=255),
    sort: str = Query(default="price", pattern="^(price|duration)$"),
):
    return dashboard_service.search_flights(origin, destination, sort)

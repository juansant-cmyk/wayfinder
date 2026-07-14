from typing import Annotated

from fastapi import APIRouter, Depends

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import RecommendedDestinationResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/destinations", tags=["destinations"])


@router.get("/recommended", response_model=list[RecommendedDestinationResponse])
async def recommended_destinations(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return dashboard_service.list_recommended_destinations()


@router.get("/{slug}", response_model=RecommendedDestinationResponse)
async def get_destination(
    slug: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return dashboard_service.get_recommended_destination(slug)

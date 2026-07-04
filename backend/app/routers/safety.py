from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import SafetySummaryResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/safety", tags=["safety"])


@router.get("/summary", response_model=SafetySummaryResponse)
async def safety_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    destination: str | None = Query(default=None, max_length=255),
):
    return dashboard_service.get_safety_summary(destination)

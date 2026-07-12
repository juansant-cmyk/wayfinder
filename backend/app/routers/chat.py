from typing import Annotated

from fastapi import APIRouter, Depends

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.dashboard import ChatMessageRequest, ChatMessageResponse
from app.services import dashboard as dashboard_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages", response_model=ChatMessageResponse)
async def send_message(
    body: ChatMessageRequest,
    current_user: Annotated[User, Depends(get_current_user)],
):
    return dashboard_service.send_chat_message(current_user.id, body.message)

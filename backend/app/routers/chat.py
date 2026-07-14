from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.providers.base import LLMProvider
from app.providers.registry import get_llm_provider
from app.routers.auth import get_current_user
from app.schemas.dashboard import ChatMessageRequest, ChatMessageResponse
from app.schemas.travel import (
    ChatMessageCreate,
    ChatMessageResponse as StoredChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatTurnResponse,
)
from app.services import chat as chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/messages", response_model=ChatMessageResponse)
async def send_message(
    body: ChatMessageRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: Annotated[LLMProvider, Depends(get_llm_provider)],
):
    session, assistant_message = await chat_service.send_one_shot_message(
        db, provider, current_user.id, body.message
    )
    return ChatMessageResponse(reply=assistant_message.content, session_id=str(session.id))


@router.post("/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(
    body: ChatSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await chat_service.create_session(db, current_user.id, body)


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await chat_service.list_sessions(db, current_user.id)


@router.get("/sessions/{session_id}/messages", response_model=list[StoredChatMessageResponse])
async def list_messages(
    session_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return await chat_service.list_messages(db, current_user.id, session_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatTurnResponse, status_code=201)
async def send_session_message(
    session_id: UUID,
    body: ChatMessageCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    provider: Annotated[LLMProvider, Depends(get_llm_provider)],
):
    user_message, assistant_message = await chat_service.send_message(
        db, provider, current_user.id, session_id, body
    )
    return ChatTurnResponse(user_message=user_message, assistant_message=assistant_message)

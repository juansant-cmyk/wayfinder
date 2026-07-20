"""Public chat service used by /chat routes."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.dashboard import ChatMessageResponse
from app.services.ai.orchestrator import run_chat_turn


async def send_chat_message(
    db: AsyncSession,
    user_id: UUID,
    message: str,
) -> ChatMessageResponse:
    return await run_chat_turn(db, user_id, message)
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import ChatMessage, ChatSession, Favorite, TravelPlan
from app.providers.base import LLMProvider
from app.schemas.travel import ChatMessageCreate, ChatSessionCreate

AI_FALLBACK = "I could not reach the AI service right now, but your saved trip context is still available."


async def create_session(db: AsyncSession, user_id: UUID, body: ChatSessionCreate) -> ChatSession:
    session = ChatSession(user_id=user_id, title=body.title)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def list_sessions(db: AsyncSession, user_id: UUID) -> list[ChatSession]:
    result = await db.execute(
        select(ChatSession).where(ChatSession.user_id == user_id).order_by(ChatSession.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_session(db: AsyncSession, user_id: UUID, session_id: UUID) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return session


async def list_messages(db: AsyncSession, user_id: UUID, session_id: UUID) -> list[ChatMessage]:
    await get_session(db, user_id, session_id)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def send_message(
    db: AsyncSession,
    provider: LLMProvider,
    user_id: UUID,
    session_id: UUID,
    body: ChatMessageCreate,
) -> tuple[ChatMessage, ChatMessage]:
    await get_session(db, user_id, session_id)
    user_message = ChatMessage(session_id=session_id, role="user", content=body.content)
    db.add(user_message)
    await db.flush()

    favorites = await _favorite_context(db, user_id)
    plans = await _plan_context(db, user_id)
    try:
        answer = await provider.answer(body.content, favorites, plans)
    except Exception:
        answer = AI_FALLBACK

    assistant_message = ChatMessage(session_id=session_id, role="assistant", content=answer)
    db.add(assistant_message)
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(assistant_message)
    return user_message, assistant_message


async def send_one_shot_message(
    db: AsyncSession,
    provider: LLMProvider,
    user_id: UUID,
    message: str,
) -> tuple[ChatSession, ChatMessage]:
    session = await create_session(db, user_id, ChatSessionCreate(title="Dashboard chat"))
    _, assistant_message = await send_message(
        db,
        provider,
        user_id,
        session.id,
        ChatMessageCreate(content=message),
    )
    return session, assistant_message


async def _favorite_context(db: AsyncSession, user_id: UUID) -> list[dict]:
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user_id).order_by(Favorite.saved_at.desc()).limit(10)
    )
    return [
        {
            "type": favorite.item_type,
            "provider": favorite.provider,
            "provider_item_id": favorite.provider_item_id,
            "snapshot": favorite.snapshot,
        }
        for favorite in result.scalars().all()
    ]


async def _plan_context(db: AsyncSession, user_id: UUID) -> list[dict]:
    result = await db.execute(
        select(TravelPlan).where(TravelPlan.user_id == user_id).order_by(TravelPlan.created_at.desc()).limit(5)
    )
    return [
        {
            "title": plan.title,
            "destination": plan.destination_name,
            "start_date": plan.start_date.isoformat() if plan.start_date else None,
            "end_date": plan.end_date.isoformat() if plan.end_date else None,
            "budget_min": float(plan.budget_min) if plan.budget_min is not None else None,
            "budget_max": float(plan.budget_max) if plan.budget_max is not None else None,
        }
        for plan in result.scalars().all()
    ]

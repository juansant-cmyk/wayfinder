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

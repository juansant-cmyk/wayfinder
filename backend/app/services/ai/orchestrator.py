"""
Chat orchestrator: collect → score → route subagent → (OpenAI|mock) → optional narrator.

Class scope: real trip context + keyword agent fallback. Tool loops / classifier later.
"""

from __future__ import annotations

import json
import logging
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.providers.anthropic_chat import AnthropicMissingKey
from app.providers.base import ChatMessage
from app.providers.openai_chat import OpenAiMissingKey
from app.providers.registry import get_chat_provider, get_narrator_provider
from app.schemas.dashboard import ChatMessageResponse
from app.services.ai.agents import AGENT_REGISTRY
from app.services.ai.agents.base import route_agent_name
from app.services.ai.context import collect_trip_context
from app.services.ai.scoring import score_candidates

logger = logging.getLogger("wayfinder.ai.orchestrator")

SYSTEM_PROMPT = """You are a helpful and fun travel advisor who will help travelers have a comfortable, safe, and interactive experience in their travelling needs. You gather context from their favorite places, weather and safety information, and popular attractions in nearby locations (or from planned destinations) and help guide the traveler to the right place, helping them find their way.

Use the scored candidates and subagent notes. Be concise and concrete.
Do not invent live hotel rates or safety facts; say when data is mocked or missing.
Safety context may be unavailable — do not invent advisories.
"""


async def run_chat_turn(
    db: AsyncSession,
    user_id: UUID,
    message: str,
) -> ChatMessageResponse:
    ctx = await collect_trip_context(db, user_id, message)
    score_candidates(ctx)

    agent_key = route_agent_name(message)
    ctx.route_agent = agent_key
    agent = AGENT_REGISTRY.get(agent_key)
    agent_note = await agent.run(ctx) if agent else "General orchestrator path."

    scored_lines = "\n".join(
        f"- [{c.kind}] {c.title} score={c.score:.2f} ({c.reason})" for c in ctx.candidates[:5]
    )
    favorites_json = json.dumps(ctx.favorite_snapshots[:10], default=str)

    user_bundle = (
        f"User message: {message}\n"
        f"Plan: {ctx.plan_title or 'none'} ({ctx.destination or 'no destination'})\n"
        f"Plan center: lat={ctx.center_lat}, lng={ctx.center_lng}\n"
        f"Weather: {ctx.weather_summary or 'unavailable'}\n"
        f"Favorites (snapshots, up to 10): {favorites_json}\n"
        f"Subagent ({agent_key}):\n{agent_note}\n"
        f"Scored candidates:\n{scored_lines or '(none)'}"
    )

    chat = get_chat_provider()
    try:
        completion = await chat.complete(
            [
                ChatMessage(role="system", content=SYSTEM_PROMPT),
                ChatMessage(role="user", content=user_bundle),
            ],
            tools=None,  # tool loop deferred past class scope
        )
    except OpenAiMissingKey as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is required when CHAT_PROVIDER=openai",
        ) from exc
    except httpx.HTTPStatusError as exc:
        logger.exception("OpenAI HTTP error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chat provider error ({exc.response.status_code})",
        ) from exc
    except httpx.HTTPError as exc:
        logger.exception("OpenAI transport error")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Chat provider unavailable",
        ) from exc

    reply = completion.content or agent_note

    narrator = get_narrator_provider()
    if narrator is not None and reply:
        try:
            reply = await narrator.narrate(
                system="Rewrite as a warm, concise Wayfinder travel tip. Keep facts.",
                user=reply,
            )
        except AnthropicMissingKey as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ANTHROPIC_API_KEY is required when NARRATOR_PROVIDER=anthropic",
            ) from exc
        except httpx.HTTPError as exc:
            logger.exception("Narrator provider error")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Narrator provider unavailable",
            ) from exc

    return ChatMessageResponse(
        reply=reply,
        session_id=str(user_id),
        provider=completion.provider,
        agent=agent_key,
    )

"""OpenAI Chat Completions adapter — primary brain for tools + subagents."""

from __future__ import annotations

import httpx

from app.core.config import settings
from app.providers.base import ChatCompletion, ChatMessage, ChatToolSpec


class OpenAiMissingKey(RuntimeError):
    pass


class OpenAiChatProvider:
    name = "openai"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = (api_key if api_key is not None else settings.openai_api_key).strip()
        self.model = (model or settings.openai_chat_model).strip() or "gpt-4o-mini"
        self.base_url = (base_url or settings.openai_base_url).rstrip("/")
        self.timeout = timeout_seconds or float(settings.external_request_timeout_seconds)

    async def complete(
        self,
        messages: list[ChatMessage],
        *,
        tools: list[ChatToolSpec] | None = None,
    ) -> ChatCompletion:
        if not self.api_key:
            raise OpenAiMissingKey("OPENAI_API_KEY is required when CHAT_PROVIDER=openai")

        payload: dict = {
            "model": self.model,
            "messages": [_message_to_openai(m) for m in messages],
        }
        if tools:
            payload["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.parameters or {"type": "object", "properties": {}},
                    },
                }
                for t in tools
            ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        choice = (data.get("choices") or [{}])[0]
        message = choice.get("message") or {}
        tool_calls = message.get("tool_calls") or []
        content = (message.get("content") or "").strip()
        if not content and tool_calls:
            content = ""  # orchestrator will run tools then re-ask

        return ChatCompletion(
            content=content,
            provider=self.name,
            model=data.get("model") or self.model,
            tool_calls=tool_calls,
            raw=data,
        )


def _message_to_openai(message: ChatMessage) -> dict:
    out: dict = {"role": message.role, "content": message.content}
    if message.name:
        out["name"] = message.name
    if message.tool_call_id:
        out["tool_call_id"] = message.tool_call_id
    return out

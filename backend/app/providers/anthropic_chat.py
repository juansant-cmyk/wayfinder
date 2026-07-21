"""Optional Claude narrator — polish scored suggestions; not the tool orchestrator."""

from __future__ import annotations

import httpx

from app.core.config import settings


class AnthropicMissingKey(RuntimeError):
    pass


class AnthropicNarratorProvider:
    name = "anthropic"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = (api_key if api_key is not None else settings.anthropic_api_key).strip()
        self.model = (model or settings.anthropic_narrator_model).strip()
        self.base_url = (base_url or settings.anthropic_base_url).rstrip("/")
        self.timeout = timeout_seconds or float(settings.external_request_timeout_seconds)

    async def narrate(self, system: str, user: str) -> str:
        if not self.api_key:
            raise AnthropicMissingKey(
                "ANTHROPIC_API_KEY is required when NARRATOR_PROVIDER=anthropic"
            )

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/messages",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        parts = data.get("content") or []
        texts = [p.get("text", "") for p in parts if p.get("type") == "text"]
        return "\n".join(t for t in texts if t).strip() or "(empty narrator reply)"

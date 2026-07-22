"""Helpers for validating HTTP JSON against Pydantic response schemas."""

from typing import Any, TypeVar

from httpx import Response
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def parse_one(model: type[T], payload: Any) -> T:
    """Parse a JSON object; raises ValidationError if the contract is broken."""
    return model.model_validate(payload)


def parse_list(model: type[T], payload: Any) -> list[T]:
    if not isinstance(payload, list):
        raise TypeError(f"expected list, got {type(payload).__name__}")
    return [model.model_validate(item) for item in payload]


def assert_json(response: Response, *, status: int = 200) -> Any:
    assert response.status_code == status, response.text
    return response.json()

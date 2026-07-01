# Stdlib imports — logging and env access for server bootstrap and runtime config.
import logging
import os
from contextlib import asynccontextmanager

# Third-party imports — FastAPI app shell and CORS middleware for cross-origin Expo requests.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Logging setup — structured output for local dev and CI; consumed by lifespan and future routers.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("wayfinder.backend")

# CORS allowlist — mirrors Expo dev-server origins (8081/19006) used by frontend/src/api/client.ts.
DEFAULT_CORS_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19006",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:19006",
]


# CORS origin resolver — reads CORS_ORIGINS from .env or falls back to Expo dev defaults.
def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "")
    if not raw.strip():
        return DEFAULT_CORS_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


# App lifespan — logs startup/shutdown so operators know the API is ready for the mobile client.
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Wayfinder backend is running on http://127.0.0.1:8000")
    logger.info("CORS allowed origins: %s", _cors_origins())
    yield
    logger.info("Wayfinder backend shutting down")


# FastAPI application — root HTTP entry point between the Expo app and future PostgreSQL-backed routes.
app = FastAPI(title="Wayfinder API", version="0.1.0", lifespan=lifespan)

# CORS middleware — permits authenticated and preflight requests from the Expo frontend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root probe — quick identity check for developers hitting http://127.0.0.1:8000 directly.
@app.get("/")
def root() -> dict[str, str]:
    return {"service": "wayfinder-backend", "status": "ok"}


# Health probe — consumed by CI (.github/workflows/ci.yml) and frontend startup before auth routes.
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}

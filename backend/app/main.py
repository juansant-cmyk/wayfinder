# FastAPI application — HTTP entry between Expo app and PostgreSQL-backed auth routes.
import logging
from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import AsyncSessionLocal, get_db
from app.routers import (
    auth,
    chat,
    destinations,
    discovery,
    favorites,
    flights,
    hotels,
    notifications,
    plans,
    safety,
    travel_check,
    weather,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("wayfinder.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Wayfinder backend is running on http://127.0.0.1:8000")
    logger.info("CORS allowed origins: %s", settings.cors_origin_list())
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        logger.info("Database connection verified")
    except SQLAlchemyError:
        logger.exception(
            "Database connection failed at startup — auth routes will not work until "
            "DATABASE_URL is fixed and Supabase schema is applied"
        )
    yield
    logger.info("Wayfinder backend shutting down")


app = FastAPI(title="Wayfinder API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(plans.router)
app.include_router(discovery.router)
app.include_router(hotels.router)
app.include_router(destinations.router)
app.include_router(flights.router)
app.include_router(favorites.router)
app.include_router(safety.router)
app.include_router(weather.router)
app.include_router(chat.router)
app.include_router(notifications.router)
app.include_router(travel_check.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "wayfinder-backend", "status": "ok"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.get("/health/db")
async def health_db(db: Annotated[AsyncSession, Depends(get_db)]) -> dict[str, str]:
    try:
        await db.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Check DATABASE_URL and Supabase schema.",
        ) from exc
    return {"status": "healthy", "database": "connected"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        detail = exc.detail
        if not isinstance(detail, str):
            detail = str(detail)
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})

    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

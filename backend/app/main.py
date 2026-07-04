# FastAPI application — HTTP entry between Expo app and PostgreSQL-backed auth routes.
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
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

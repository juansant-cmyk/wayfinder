from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import FareEvent, FareWatch
from app.providers.base import FareProvider
from app.schemas.travel import FareWatchCreate


async def list_watches(db: AsyncSession, user_id: UUID) -> list[FareWatch]:
    result = await db.execute(
        select(FareWatch).where(FareWatch.user_id == user_id).order_by(FareWatch.created_at.desc())
    )
    return list(result.scalars().all())


async def create_watch(
    db: AsyncSession, provider: FareProvider, user_id: UUID, body: FareWatchCreate
) -> FareWatch:
    watch = FareWatch(user_id=user_id, **body.model_dump())
    db.add(watch)
    await db.flush()

    latest = await provider.latest_price(
        watch.watch_type,
        watch.origin,
        watch.destination,
        watch.hotel_id,
        watch.currency,
    )
    db.add(
        FareEvent(
            watch_id=watch.id,
            price=latest.price,
            currency=latest.currency,
            provider=latest.provider,
            metadata_json=latest.metadata_json,
        )
    )
    await db.commit()
    await db.refresh(watch)
    return watch


async def get_watch(db: AsyncSession, user_id: UUID, watch_id: UUID) -> FareWatch:
    result = await db.execute(
        select(FareWatch).where(FareWatch.id == watch_id, FareWatch.user_id == user_id)
    )
    watch = result.scalar_one_or_none()
    if watch is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fare watch not found")
    return watch


async def delete_watch(db: AsyncSession, user_id: UUID, watch_id: UUID) -> None:
    watch = await get_watch(db, user_id, watch_id)
    await db.delete(watch)
    await db.commit()


async def list_events(db: AsyncSession, user_id: UUID, watch_id: UUID) -> list[FareEvent]:
    await get_watch(db, user_id, watch_id)
    result = await db.execute(
        select(FareEvent)
        .where(FareEvent.watch_id == watch_id)
        .order_by(FareEvent.observed_at.desc())
    )
    return list(result.scalars().all())

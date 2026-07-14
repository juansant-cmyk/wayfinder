from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import Favorite
from app.schemas.dashboard import FavoriteCreateRequest, FavoriteItemResponse


def favorite_to_response(row: Favorite) -> FavoriteItemResponse:
    snap = row.snapshot or {}
    return FavoriteItemResponse(
        id=row.id,
        item_type=row.item_type,
        provider=row.provider,
        provider_item_id=row.provider_item_id,
        entity_id=row.entity_id,
        title=str(snap.get("name") or "Saved item"),
        subtitle=snap.get("subtitle"),
        image_url=snap.get("image_url"),
        price=snap.get("price"),
        currency=snap.get("currency"),
        rating=snap.get("rating"),
        address=snap.get("address"),
        lat=snap.get("lat"),
        lng=snap.get("lng"),
        saved_at=row.saved_at,
        snapshot=dict(snap),
    )


async def list_favorites(db: AsyncSession, user_id: UUID) -> list[FavoriteItemResponse]:
    result = await db.execute(
        select(Favorite)
        .where(Favorite.user_id == user_id)
        .order_by(Favorite.saved_at.desc())
    )
    return [favorite_to_response(row) for row in result.scalars().all()]


async def upsert_favorite(
    db: AsyncSession, user_id: UUID, body: FavoriteCreateRequest
) -> FavoriteItemResponse:
    snapshot = body.snapshot.model_dump(mode="json")
    stmt = (
        insert(Favorite)
        .values(
            user_id=user_id,
            item_type=body.item_type,
            provider=body.provider,
            provider_item_id=body.provider_item_id,
            entity_id=body.entity_id,
            snapshot=snapshot,
        )
        .on_conflict_do_update(
            constraint="favorites_user_item_unique",
            set_={
                "entity_id": body.entity_id,
                "snapshot": snapshot,
                "updated_at": func.now(),
            },
        )
        .returning(Favorite)
    )
    result = await db.execute(stmt)
    row = result.scalar_one()
    await db.commit()
    await db.refresh(row)
    return favorite_to_response(row)


async def delete_favorite(
    db: AsyncSession,
    user_id: UUID,
    *,
    item_type: str,
    provider: str,
    provider_item_id: str,
) -> None:
    await db.execute(
        delete(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.item_type == item_type,
            Favorite.provider == provider,
            Favorite.provider_item_id == provider_item_id,
        )
    )
    await db.commit()

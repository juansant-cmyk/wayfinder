from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.travel import Favorite, TravelPlan
from app.schemas.dashboard import FavoriteCreateRequest, FavoriteItemResponse
from app.schemas.travel import night_count

PLAN_FAVORITE_ITEM_TYPE = "plan"
PLAN_FAVORITE_PROVIDER = "wayfinder"


def _format_plan_date_range(start, end) -> str:
    if not start or not end:
        return ""
    same_year = start.year == end.year
    start_label = f"{start.strftime('%b')} {start.day}"
    if same_year:
        end_label = f"{end.strftime('%b')} {end.day}, {end.year}"
    else:
        start_label = f"{start.strftime('%b')} {start.day}, {start.year}"
        end_label = f"{end.strftime('%b')} {end.day}, {end.year}"
    return f"{start_label} - {end_label}"


def _format_nights(nights: int | None) -> str:
    if nights is None:
        return ""
    return "1 Night" if nights == 1 else f"{nights} Nights"


def plan_favorite_snapshot(plan: TravelPlan) -> dict:
    nights = None
    if plan.start_date and plan.end_date:
        nights = night_count(plan.start_date, plan.end_date)
    dates = _format_plan_date_range(plan.start_date, plan.end_date)
    nights_label = _format_nights(nights)
    subtitle = " • ".join(part for part in (dates, nights_label) if part) or None
    return {
        "name": plan.title or "Trip",
        "subtitle": subtitle,
        "address": plan.destination_name or None,
        "image_url": plan.cover_image_url or None,
    }


def favorite_to_response(row: Favorite, *, snapshot_override: dict | None = None) -> FavoriteItemResponse:
    snap = snapshot_override if snapshot_override is not None else (row.snapshot or {})
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
    rows = list(result.scalars().all())

    plan_keys: list[str] = []
    for row in rows:
        if row.item_type != PLAN_FAVORITE_ITEM_TYPE:
            continue
        plan_keys.append(str(row.provider_item_id))
        if row.entity_id is not None:
            plan_keys.append(str(row.entity_id))

    plans_by_id: dict[str, TravelPlan] = {}
    unique_ids: list[UUID] = []
    for key in plan_keys:
        try:
            unique_ids.append(UUID(key))
        except (TypeError, ValueError):
            continue
    if unique_ids:
        plans_result = await db.execute(
            select(TravelPlan).where(
                TravelPlan.user_id == user_id,
                TravelPlan.id.in_(list(set(unique_ids))),
            )
        )
        plans_by_id = {str(plan.id): plan for plan in plans_result.scalars().all()}

    responses: list[FavoriteItemResponse] = []
    snapshots_dirty = False
    for row in rows:
        if row.item_type == PLAN_FAVORITE_ITEM_TYPE:
            plan = plans_by_id.get(str(row.provider_item_id))
            if plan is None and row.entity_id is not None:
                plan = plans_by_id.get(str(row.entity_id))
            if plan is not None:
                live_snap = plan_favorite_snapshot(plan)
                # Refresh path: keep stored snapshot aligned with the live plan
                # so Favorites always reflects itinerary edits on reload.
                if (row.snapshot or {}) != live_snap or row.entity_id != plan.id:
                    row.snapshot = live_snap
                    row.entity_id = plan.id
                    snapshots_dirty = True
                responses.append(favorite_to_response(row, snapshot_override=live_snap))
                continue
        responses.append(favorite_to_response(row))
    if snapshots_dirty:
        await db.commit()
    return responses


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


async def sync_plan_favorite_snapshot(
    db: AsyncSession, user_id: UUID, plan: TravelPlan
) -> None:
    """Keep stored plan-favorite snapshot aligned after itinerary edits."""
    snapshot = plan_favorite_snapshot(plan)
    await db.execute(
        update(Favorite)
        .where(
            Favorite.user_id == user_id,
            Favorite.item_type == PLAN_FAVORITE_ITEM_TYPE,
            Favorite.provider == PLAN_FAVORITE_PROVIDER,
            Favorite.provider_item_id == str(plan.id),
        )
        .values(snapshot=snapshot, entity_id=plan.id, updated_at=func.now())
    )


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

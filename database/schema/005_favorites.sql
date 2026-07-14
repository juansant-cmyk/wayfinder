-- Polymorphic favorites (hotels now; restaurants / destinations later).
-- Heart identity: (user_id, item_type, provider, provider_item_id)

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_item_id TEXT NOT NULL,
    entity_id UUID,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT favorites_user_item_unique
        UNIQUE (user_id, item_type, provider, provider_item_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_saved_at_idx
    ON favorites (user_id, saved_at DESC);

CREATE INDEX IF NOT EXISTS favorites_user_item_type_idx
    ON favorites (user_id, item_type);

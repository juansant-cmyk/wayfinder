-- Trip lifecycle for switcher + agent-ready history (active | completed).
ALTER TABLE travel_plans
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suppress_auto_complete BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE travel_plans
    DROP CONSTRAINT IF EXISTS travel_plans_status_check;

ALTER TABLE travel_plans
    ADD CONSTRAINT travel_plans_status_check
    CHECK (status IN ('active', 'completed'));

CREATE INDEX IF NOT EXISTS travel_plans_user_status_idx
    ON travel_plans (user_id, status);

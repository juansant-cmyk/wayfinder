-- Plan hotel link + normalized itinerary days/activities
ALTER TABLE travel_plans
    ADD COLUMN IF NOT EXISTS hotel_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS hotel_provider VARCHAR(50),
    ADD COLUMN IF NOT EXISTS hotel_provider_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES travel_plans(id) ON DELETE CASCADE,
    day_date DATE NOT NULL,
    sort_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT plan_days_plan_date_unique UNIQUE (plan_id, day_date)
);

CREATE INDEX IF NOT EXISTS plan_days_plan_id_idx ON plan_days(plan_id);

CREATE TABLE IF NOT EXISTS plan_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID NOT NULL REFERENCES plan_days(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL DEFAULT 'custom',
    time_label VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    category VARCHAR(40) NOT NULL DEFAULT 'travel',
    tag_label VARCHAR(120),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    sort_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT plan_activities_kind_check CHECK (kind IN ('check_in', 'check_out', 'custom'))
);

CREATE INDEX IF NOT EXISTS plan_activities_day_id_idx ON plan_activities(day_id);

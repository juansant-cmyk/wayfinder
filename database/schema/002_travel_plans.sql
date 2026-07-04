-- Sprint 1-2: user-owned travel plans
CREATE TABLE IF NOT EXISTS travel_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION NOT NULL DEFAULT 5,
    budget_min NUMERIC(10, 2),
    budget_max NUMERIC(10, 2),
    traveler_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT travel_plans_radius_check CHECK (radius_km BETWEEN 1 AND 25),
    CONSTRAINT travel_plans_traveler_count_check CHECK (traveler_count >= 1),
    CONSTRAINT travel_plans_dates_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT travel_plans_budget_check CHECK (budget_max IS NULL OR budget_min IS NULL OR budget_max >= budget_min)
);

CREATE INDEX IF NOT EXISTS travel_plans_user_id_idx ON travel_plans(user_id);

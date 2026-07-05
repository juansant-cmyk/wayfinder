-- Wayfinder schema for Supabase SQL Editor (run once on a new project)
-- Dashboard: SQL → New query → paste → Run

CREATE EXTENSION IF NOT EXISTS postgis;

-- 001 users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(40) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_username_unique UNIQUE (username)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (LOWER(username));

-- 002 travel plans
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

-- 003 places and hotels
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    provider_place_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    address VARCHAR(500),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) STORED,
    rating DOUBLE PRECISION,
    popularity_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT places_provider_place_unique UNIQUE (provider, provider_place_id)
);

CREATE INDEX IF NOT EXISTS places_geom_gix ON places USING GIST (geom);
CREATE INDEX IF NOT EXISTS places_category_idx ON places(category);

CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    provider_hotel_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    nightly_rate NUMERIC(10, 2) NOT NULL,
    total_estimate NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
    rating DOUBLE PRECISION,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT hotels_provider_hotel_unique UNIQUE (provider, provider_hotel_id)
);

CREATE INDEX IF NOT EXISTS hotels_nightly_rate_idx ON hotels(nightly_rate);

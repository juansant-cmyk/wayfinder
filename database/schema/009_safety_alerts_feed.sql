-- Safety alert feed, dismissals, and country risk snapshots.

CREATE TABLE IF NOT EXISTS safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(50) NOT NULL,
    dedupe_key VARCHAR(64) NOT NULL,
    provider_alert_id VARCHAR(255),
    country_iso VARCHAR(3),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    destination VARCHAR(255) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    headline VARCHAR(255),
    urgency VARCHAR(50),
    areas TEXT,
    event VARCHAR(255),
    instruction TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT safety_alerts_source_dedupe_unique UNIQUE (source, dedupe_key)
);

CREATE INDEX IF NOT EXISTS safety_alerts_destination_idx
    ON safety_alerts(destination);

CREATE INDEX IF NOT EXISTS safety_alerts_destination_ends_at_idx
    ON safety_alerts(destination, ends_at);

CREATE INDEX IF NOT EXISTS safety_alerts_provider_alert_id_idx
    ON safety_alerts (provider_alert_id);

CREATE INDEX IF NOT EXISTS safety_alerts_country_iso_idx
    ON safety_alerts (country_iso);

CREATE UNIQUE INDEX IF NOT EXISTS safety_alerts_source_provider_alert_unique
    ON safety_alerts (source, provider_alert_id)
    WHERE provider_alert_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS alert_dismissals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES safety_alerts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT alert_dismissals_user_alert_unique UNIQUE (user_id, alert_id)
);

CREATE INDEX IF NOT EXISTS alert_dismissals_user_id_idx
    ON alert_dismissals(user_id);

CREATE TABLE IF NOT EXISTS safety_risk_snapshots (
    country_iso VARCHAR(3) PRIMARY KEY,
    country_name VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

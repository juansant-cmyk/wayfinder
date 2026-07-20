CREATE TABLE IF NOT EXISTS safety_risk_snapshots (
    country_iso VARCHAR(3) PRIMARY KEY,
    country_name VARCHAR(120) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE safety_alerts
    ADD COLUMN IF NOT EXISTS provider_alert_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS country_iso VARCHAR(3),
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS safety_alerts_provider_alert_id_idx
    ON safety_alerts (provider_alert_id);
CREATE INDEX IF NOT EXISTS safety_alerts_country_iso_idx
    ON safety_alerts (country_iso);
CREATE UNIQUE INDEX IF NOT EXISTS safety_alerts_source_provider_alert_unique
    ON safety_alerts (source, provider_alert_id)
    WHERE provider_alert_id IS NOT NULL;

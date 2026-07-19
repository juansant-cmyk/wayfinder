-- Stable provider-alert identity and active-alert query support.

ALTER TABLE IF EXISTS safety_alerts
    ADD COLUMN IF NOT EXISTS dedupe_key VARCHAR(64);

UPDATE safety_alerts
SET dedupe_key = 'legacy:' || md5(
    concat_ws(
        '|',
        lower(source),
        lower(destination),
        lower(COALESCE(event, title)),
        COALESCE(starts_at::text, ''),
        COALESCE(ends_at::text, '')
    )
)
WHERE dedupe_key IS NULL;

ALTER TABLE IF EXISTS safety_alerts
    ALTER COLUMN dedupe_key SET NOT NULL;

ALTER TABLE IF EXISTS safety_alerts
    DROP CONSTRAINT IF EXISTS safety_alerts_source_destination_title_unique;

ALTER TABLE IF EXISTS safety_alerts
    DROP CONSTRAINT IF EXISTS safety_alerts_source_dedupe_unique;

ALTER TABLE IF EXISTS safety_alerts
    ADD CONSTRAINT safety_alerts_source_dedupe_unique UNIQUE (source, dedupe_key);

CREATE INDEX IF NOT EXISTS safety_alerts_destination_ends_at_idx
    ON safety_alerts(destination, ends_at);

-- Sprint 1: profile fields collected at registration (US-01)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS username VARCHAR(40);

UPDATE users
SET
    full_name = COALESCE(full_name, split_part(email, '@', 1)),
    username = COALESCE(username, 'user_' || replace(id::text, '-', ''))
WHERE full_name IS NULL OR username IS NULL;

ALTER TABLE users
    ALTER COLUMN full_name SET NOT NULL,
    ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (LOWER(username));

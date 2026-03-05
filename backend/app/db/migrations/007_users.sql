CREATE TABLE IF NOT EXISTS users (
    id              TEXT      PRIMARY KEY,
    email           TEXT      NOT NULL UNIQUE,
    hashed_password TEXT      NOT NULL,
    role            TEXT      NOT NULL DEFAULT 'user'
                              CHECK (role IN ('admin', 'user')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

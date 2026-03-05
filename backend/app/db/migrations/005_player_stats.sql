-- Migration 005: Player stats tables
-- Three tables: all-time stats, monthly stats, and idempotency log.

CREATE TABLE IF NOT EXISTS player_stats (
    player_id              TEXT PRIMARY KEY,
    mexicano_score_total   INTEGER NOT NULL DEFAULT 0,
    btb_score_total        INTEGER NOT NULL DEFAULT 0,
    events_attended        INTEGER NOT NULL DEFAULT 0,
    wc_matches_played      INTEGER NOT NULL DEFAULT 0,
    wc_wins                INTEGER NOT NULL DEFAULT 0,
    wc_losses              INTEGER NOT NULL DEFAULT 0,
    btb_wins               INTEGER NOT NULL DEFAULT 0,
    btb_losses             INTEGER NOT NULL DEFAULT 0,
    btb_draws              INTEGER NOT NULL DEFAULT 0,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_player_stats (
    player_id       TEXT    NOT NULL,
    year            INTEGER NOT NULL,
    month           INTEGER NOT NULL,
    events_played   INTEGER NOT NULL DEFAULT 0,
    mexicano_score  INTEGER NOT NULL DEFAULT 0,
    btb_score       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (player_id, year, month)
);

CREATE TABLE IF NOT EXISTS player_stats_event_log (
    event_id      TEXT PRIMARY KEY,
    applied_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

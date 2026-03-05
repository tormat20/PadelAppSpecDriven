-- Migration 006: Rename 'BeatTheBox' -> 'RankedBox' everywhere.
-- DuckDB does not support ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT,
-- so we use the backup-and-recreate pattern for tables with CHECK constraints,
-- and ALTER TABLE ... RENAME COLUMN for simple column renames.

-- ── 1. Rename event_type wire value in events table ─────────────────────────

CREATE TABLE _bak_events AS SELECT * FROM events;

DROP TABLE events;

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('WinnersCourt', 'Mexicano', 'RankedBox')),
  event_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Lobby', 'Running', 'Finished')),
  round_count INTEGER NOT NULL,
  round_duration_minutes INTEGER NOT NULL,
  current_round_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_time TEXT,
  setup_status TEXT DEFAULT 'planned',
  version INTEGER DEFAULT 1
);

INSERT INTO events (
  id, event_name, event_type, event_date, status,
  round_count, round_duration_minutes, current_round_number,
  created_at, updated_at, event_time, setup_status, version
)
SELECT
  id,
  event_name,
  CASE WHEN event_type = 'BeatTheBox' THEN 'RankedBox' ELSE event_type END,
  event_date,
  status,
  round_count,
  round_duration_minutes,
  current_round_number,
  created_at,
  updated_at,
  event_time,
  setup_status,
  version
FROM _bak_events;

DROP TABLE _bak_events;

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ── 2. Rename btb_ columns in player_stats ──────────────────────────────────

ALTER TABLE player_stats RENAME COLUMN btb_score_total TO rb_score_total;
ALTER TABLE player_stats RENAME COLUMN btb_wins        TO rb_wins;
ALTER TABLE player_stats RENAME COLUMN btb_losses      TO rb_losses;
ALTER TABLE player_stats RENAME COLUMN btb_draws       TO rb_draws;

-- ── 3. Rename btb_score column in monthly_player_stats ──────────────────────

ALTER TABLE monthly_player_stats RENAME COLUMN btb_score TO rb_score;

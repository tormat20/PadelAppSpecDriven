-- Migration 012: Add 'Americano' to the event_type CHECK constraint.
--
-- The current events table (from migration 006) uses:
--   event_type TEXT NOT NULL CHECK (event_type IN ('WinnersCourt', 'Mexicano', 'RankedBox'))
--
-- DuckDB does not support ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT,
-- so we use the backup-and-recreate pattern.

CREATE TABLE _bak_events_012 AS SELECT * FROM events;

DROP TABLE events;

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('WinnersCourt', 'Mexicano', 'RankedBox', 'Americano')),
  event_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Lobby', 'Running', 'Finished')),
  round_count INTEGER NOT NULL,
  round_duration_minutes INTEGER NOT NULL,
  current_round_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  event_time TEXT,
  setup_status TEXT DEFAULT 'planned',
  version INTEGER DEFAULT 1,
  is_team_mexicano BOOLEAN DEFAULT FALSE
);

INSERT INTO events (
  id, event_name, event_type, event_date, status,
  round_count, round_duration_minutes, current_round_number,
  created_at, updated_at, event_time, setup_status, version, is_team_mexicano
)
SELECT
  id, event_name, event_type, event_date, status,
  round_count, round_duration_minutes, current_round_number,
  created_at, updated_at, event_time, setup_status, version, is_team_mexicano
FROM _bak_events_012;

DROP TABLE _bak_events_012;

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

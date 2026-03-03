-- Rename wire value 'Americano' -> 'WinnersCourt' in the events table.
-- DuckDB does not support ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT,
-- so we use the backup-and-recreate pattern (same as migration 003).

CREATE TABLE _bak_events AS SELECT * FROM events;

DROP TABLE events;

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('WinnersCourt', 'Mexicano', 'BeatTheBox')),
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
  CASE WHEN event_type = 'Americano' THEN 'WinnersCourt' ELSE event_type END,
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

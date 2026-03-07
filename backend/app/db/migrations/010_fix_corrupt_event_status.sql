-- Migration 010: fix corrupt event status
-- Events in Lobby status that already have rounds are corrupt (they were
-- started but the status was never updated to Running). Set them to Running
-- so that start_event() can recover gracefully instead of raising
-- EVENT_ALREADY_STARTED.
--
-- DuckDB v1.4.x enforces FK constraints on UPDATE of any column of a
-- referenced parent row when child rows exist (even non-PK columns).
-- event_teams (008) and event_substitutions (009) both have
-- REFERENCES events(id), so we must drop them, run the UPDATE, then
-- recreate them with the same DDL and restore the data.

CREATE TABLE _bak_event_teams AS SELECT * FROM event_teams;
CREATE TABLE _bak_event_substitutions AS SELECT * FROM event_substitutions;

DROP TABLE event_substitutions;
DROP TABLE event_teams;

UPDATE events
SET status = 'Running'
WHERE status = 'Lobby'
  AND id IN (SELECT DISTINCT event_id FROM rounds);

CREATE TABLE event_teams (
    id         TEXT PRIMARY KEY,
    event_id   TEXT NOT NULL REFERENCES events(id),
    player1_id TEXT NOT NULL REFERENCES players(id),
    player2_id TEXT NOT NULL REFERENCES players(id)
);

CREATE TABLE event_substitutions (
    id                   TEXT PRIMARY KEY,
    event_id             TEXT NOT NULL REFERENCES events(id),
    departing_player_id  TEXT NOT NULL REFERENCES players(id),
    substitute_player_id TEXT NOT NULL REFERENCES players(id),
    effective_from_round INT  NOT NULL
);

INSERT INTO event_teams (id, event_id, player1_id, player2_id)
SELECT id, event_id, player1_id, player2_id FROM _bak_event_teams;

INSERT INTO event_substitutions (id, event_id, departing_player_id, substitute_player_id, effective_from_round)
SELECT id, event_id, departing_player_id, substitute_player_id, effective_from_round FROM _bak_event_substitutions;

DROP TABLE _bak_event_teams;
DROP TABLE _bak_event_substitutions;

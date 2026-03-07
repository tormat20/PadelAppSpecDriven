-- Migration 011: remove REFERENCES events(id) FK from event_teams and event_substitutions
--
-- DuckDB v1.4.x enforces FK constraints on UPDATE of ANY column of a referenced
-- parent row when child rows exist — even when the PK is not being changed.
-- This means the runtime set_status.sql UPDATE (called by start_event) crashes
-- with a ConstraintException whenever event_teams or event_substitutions already
-- has rows for the event being updated.
--
-- The established pattern in this project (see migration 003) is to NOT declare
-- REFERENCES events(id) on child tables; only player FKs are retained.
-- Migrations 008 and 009 incorrectly added those event FKs; this migration
-- removes them permanently so that set_status.sql works at runtime.

CREATE TABLE _bak_event_teams AS SELECT * FROM event_teams;
CREATE TABLE _bak_event_substitutions AS SELECT * FROM event_substitutions;

DROP TABLE event_substitutions;
DROP TABLE event_teams;

-- Recreate WITHOUT REFERENCES events(id) — matches the pattern of migration 003
CREATE TABLE event_teams (
    id         TEXT PRIMARY KEY,
    event_id   TEXT NOT NULL,
    player1_id TEXT NOT NULL REFERENCES players(id),
    player2_id TEXT NOT NULL REFERENCES players(id)
);

CREATE TABLE event_substitutions (
    id                   TEXT PRIMARY KEY,
    event_id             TEXT NOT NULL,
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

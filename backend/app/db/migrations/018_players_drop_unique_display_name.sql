-- Migration 018: drop UNIQUE(display_name) from players
--
-- DuckDB enforces foreign key constraints in a way that prevents UPDATEs on a
-- parent row when a UNIQUE-constrained column changes and child FK rows exist.
--
-- In this codebase we already enforce name uniqueness in PlayerService, so we
-- can safely remove the DB-level UNIQUE(display_name) constraint to allow
-- updating player names for players referenced by event/history tables.

CREATE TABLE _bak_players AS SELECT * FROM players;
CREATE TABLE _bak_event_players AS SELECT * FROM event_players;
CREATE TABLE _bak_event_scores AS SELECT * FROM event_scores;
CREATE TABLE _bak_player_round_scores AS SELECT * FROM player_round_scores;
CREATE TABLE _bak_global_rankings AS SELECT * FROM global_rankings;
CREATE TABLE _bak_event_teams AS SELECT * FROM event_teams;
CREATE TABLE _bak_event_substitutions AS SELECT * FROM event_substitutions;

DROP TABLE event_substitutions;
DROP TABLE event_teams;
DROP TABLE global_rankings;
DROP TABLE player_round_scores;
DROP TABLE event_scores;
DROP TABLE event_players;
DROP TABLE players;

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  global_ranking_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  email TEXT
);

CREATE TABLE event_players (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  seed_order INTEGER,
  UNIQUE (event_id, player_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE event_scores (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rank_position INTEGER,
  UNIQUE (event_id, player_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE player_round_scores (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  score_delta INTEGER NOT NULL,
  score_total_in_event INTEGER NOT NULL,
  UNIQUE (round_id, player_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE global_rankings (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE event_teams (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player1_id TEXT NOT NULL REFERENCES players(id),
  player2_id TEXT NOT NULL REFERENCES players(id)
);

CREATE TABLE event_substitutions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  departing_player_id TEXT NOT NULL REFERENCES players(id),
  substitute_player_id TEXT NOT NULL REFERENCES players(id),
  effective_from_round INT NOT NULL
);

INSERT INTO players (id, display_name, global_ranking_score, created_at, updated_at, email)
SELECT id, display_name, global_ranking_score, created_at, updated_at, email FROM _bak_players;

INSERT INTO event_players (id, event_id, player_id, seed_order)
SELECT id, event_id, player_id, seed_order FROM _bak_event_players;

INSERT INTO event_scores (id, event_id, player_id, total_score, rank_position)
SELECT id, event_id, player_id, total_score, rank_position FROM _bak_event_scores;

INSERT INTO player_round_scores (id, event_id, round_id, player_id, score_delta, score_total_in_event)
SELECT id, event_id, round_id, player_id, score_delta, score_total_in_event FROM _bak_player_round_scores;

INSERT INTO global_rankings (id, player_id, score, updated_at)
SELECT id, player_id, score, updated_at FROM _bak_global_rankings;

INSERT INTO event_teams (id, event_id, player1_id, player2_id)
SELECT id, event_id, player1_id, player2_id FROM _bak_event_teams;

INSERT INTO event_substitutions (id, event_id, departing_player_id, substitute_player_id, effective_from_round)
SELECT id, event_id, departing_player_id, substitute_player_id, effective_from_round FROM _bak_event_substitutions;

DROP TABLE _bak_players;
DROP TABLE _bak_event_players;
DROP TABLE _bak_event_scores;
DROP TABLE _bak_player_round_scores;
DROP TABLE _bak_global_rankings;
DROP TABLE _bak_event_teams;
DROP TABLE _bak_event_substitutions;

CREATE INDEX IF NOT EXISTS idx_event_scores_event ON event_scores(event_id);

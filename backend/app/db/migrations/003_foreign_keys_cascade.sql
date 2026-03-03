CREATE TABLE _bak_event_players AS SELECT * FROM event_players;
CREATE TABLE _bak_event_courts AS SELECT * FROM event_courts;
CREATE TABLE _bak_rounds AS SELECT * FROM rounds;
CREATE TABLE _bak_matches AS SELECT * FROM matches;
CREATE TABLE _bak_event_scores AS SELECT * FROM event_scores;
CREATE TABLE _bak_player_round_scores AS SELECT * FROM player_round_scores;
CREATE TABLE _bak_global_rankings AS SELECT * FROM global_rankings;

DROP TABLE event_players;
DROP TABLE event_courts;
DROP TABLE rounds;
DROP TABLE matches;
DROP TABLE event_scores;
DROP TABLE player_round_scores;
DROP TABLE global_rankings;

CREATE TABLE event_players (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  seed_order INTEGER,
  UNIQUE (event_id, player_id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE event_courts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  court_number INTEGER NOT NULL CHECK (court_number BETWEEN 1 AND 7),
  UNIQUE (event_id, court_number)
);

CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Running', 'Completed')),
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  UNIQUE (event_id, round_number)
);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  court_number INTEGER NOT NULL CHECK (court_number BETWEEN 1 AND 7),
  team1_player1_id TEXT NOT NULL,
  team1_player2_id TEXT NOT NULL,
  team2_player1_id TEXT NOT NULL,
  team2_player2_id TEXT NOT NULL,
  result_type TEXT NOT NULL CHECK (result_type IN ('WinLoss', 'Score24', 'WinLossDraw')),
  winner_team INTEGER,
  is_draw BOOLEAN NOT NULL DEFAULT FALSE,
  team1_score INTEGER,
  team2_score INTEGER,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

INSERT INTO event_players (id, event_id, player_id, seed_order)
SELECT id, event_id, player_id, seed_order FROM _bak_event_players;

INSERT INTO event_courts (id, event_id, court_number)
SELECT id, event_id, court_number FROM _bak_event_courts;

INSERT INTO rounds (id, event_id, round_number, status, starts_at, ends_at)
SELECT id, event_id, round_number, status, starts_at, ends_at FROM _bak_rounds;

INSERT INTO matches (
  id, event_id, round_id, court_number,
  team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id,
  result_type, winner_team, is_draw, team1_score, team2_score, status, created_at, updated_at
)
SELECT
  id, event_id, round_id, court_number,
  team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id,
  result_type, winner_team, is_draw, team1_score, team2_score, status, created_at, updated_at
FROM _bak_matches;

INSERT INTO event_scores (id, event_id, player_id, total_score, rank_position)
SELECT id, event_id, player_id, total_score, rank_position FROM _bak_event_scores;

INSERT INTO player_round_scores (
  id, event_id, round_id, player_id, score_delta, score_total_in_event
)
SELECT id, event_id, round_id, player_id, score_delta, score_total_in_event
FROM _bak_player_round_scores;

INSERT INTO global_rankings (id, player_id, score, updated_at)
SELECT id, player_id, score, updated_at FROM _bak_global_rankings;

DROP TABLE _bak_event_players;
DROP TABLE _bak_event_courts;
DROP TABLE _bak_rounds;
DROP TABLE _bak_matches;
DROP TABLE _bak_event_scores;
DROP TABLE _bak_player_round_scores;
DROP TABLE _bak_global_rankings;

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_rounds_event_round ON rounds(event_id, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_event ON event_scores(event_id);

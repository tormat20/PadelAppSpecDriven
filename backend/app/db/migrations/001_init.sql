CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL UNIQUE,
  global_ranking_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('Americano', 'Mexicano', 'BeatTheBox')),
  event_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Lobby', 'Running', 'Finished')),
  round_count INTEGER NOT NULL,
  round_duration_minutes INTEGER NOT NULL,
  current_round_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_players (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  seed_order INTEGER,
  UNIQUE (event_id, player_id)
);

CREATE TABLE IF NOT EXISTS event_courts (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  court_number INTEGER NOT NULL CHECK (court_number BETWEEN 1 AND 7),
  UNIQUE (event_id, court_number)
);

CREATE TABLE IF NOT EXISTS rounds (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Running', 'Completed')),
  starts_at TIMESTAMP,
  ends_at TIMESTAMP,
  UNIQUE (event_id, round_number)
);

CREATE TABLE IF NOT EXISTS matches (
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

CREATE TABLE IF NOT EXISTS event_scores (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rank_position INTEGER,
  UNIQUE (event_id, player_id)
);

CREATE TABLE IF NOT EXISTS player_round_scores (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  score_delta INTEGER NOT NULL,
  score_total_in_event INTEGER NOT NULL,
  UNIQUE (round_id, player_id)
);

CREATE TABLE IF NOT EXISTS global_rankings (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_rounds_event_round ON rounds(event_id, round_number);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round_id);
CREATE INDEX IF NOT EXISTS idx_event_scores_event ON event_scores(event_id);

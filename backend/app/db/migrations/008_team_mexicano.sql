ALTER TABLE events ADD COLUMN is_team_mexicano BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS event_teams (
    id          TEXT PRIMARY KEY,
    event_id    TEXT NOT NULL REFERENCES events(id),
    player1_id  TEXT NOT NULL REFERENCES players(id),
    player2_id  TEXT NOT NULL REFERENCES players(id)
);

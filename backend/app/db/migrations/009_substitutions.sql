CREATE TABLE IF NOT EXISTS event_substitutions (
    id                   TEXT PRIMARY KEY,
    event_id             TEXT NOT NULL REFERENCES events(id),
    departing_player_id  TEXT NOT NULL REFERENCES players(id),
    substitute_player_id TEXT NOT NULL REFERENCES players(id),
    effective_from_round INT  NOT NULL
);

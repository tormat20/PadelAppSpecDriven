ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS team_mexicano_score_total INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS mexicano_events_played INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS team_mexicano_events_played INTEGER DEFAULT 0;

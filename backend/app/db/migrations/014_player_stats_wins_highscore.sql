-- Migration 014: Add mexicano_best_event_score, event_wins, last_win_at to player_stats
-- These columns power the Mexicano Highscore leaderboard, Event Wins stat, and Fire Emblem hot-streak badge.

ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS mexicano_best_event_score INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS event_wins                  INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS last_win_at                 TIMESTAMP;

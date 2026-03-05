INSERT INTO monthly_player_stats (
    player_id,
    year,
    month,
    events_played,
    mexicano_score,
    rb_score
)
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT (player_id, year, month) DO UPDATE SET
    events_played  = monthly_player_stats.events_played  + excluded.events_played,
    mexicano_score = monthly_player_stats.mexicano_score + excluded.mexicano_score,
    rb_score       = monthly_player_stats.rb_score       + excluded.rb_score;

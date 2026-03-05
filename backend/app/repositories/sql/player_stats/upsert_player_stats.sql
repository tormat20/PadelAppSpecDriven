INSERT INTO player_stats (
    player_id,
    mexicano_score_total,
    rb_score_total,
    events_attended,
    wc_matches_played,
    wc_wins,
    wc_losses,
    rb_wins,
    rb_losses,
    rb_draws,
    updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
ON CONFLICT (player_id) DO UPDATE SET
    mexicano_score_total = player_stats.mexicano_score_total + excluded.mexicano_score_total,
    rb_score_total       = player_stats.rb_score_total       + excluded.rb_score_total,
    events_attended      = player_stats.events_attended      + excluded.events_attended,
    wc_matches_played    = player_stats.wc_matches_played    + excluded.wc_matches_played,
    wc_wins              = player_stats.wc_wins              + excluded.wc_wins,
    wc_losses            = player_stats.wc_losses            + excluded.wc_losses,
    rb_wins              = player_stats.rb_wins              + excluded.rb_wins,
    rb_losses            = player_stats.rb_losses            + excluded.rb_losses,
    rb_draws             = player_stats.rb_draws             + excluded.rb_draws,
    updated_at           = NOW();

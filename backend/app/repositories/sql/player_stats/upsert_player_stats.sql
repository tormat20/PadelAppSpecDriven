INSERT INTO player_stats (
    player_id,
    mexicano_score_total,
    btb_score_total,
    events_attended,
    wc_matches_played,
    wc_wins,
    wc_losses,
    btb_wins,
    btb_losses,
    btb_draws,
    updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
ON CONFLICT (player_id) DO UPDATE SET
    mexicano_score_total = player_stats.mexicano_score_total + excluded.mexicano_score_total,
    btb_score_total      = player_stats.btb_score_total      + excluded.btb_score_total,
    events_attended      = player_stats.events_attended      + excluded.events_attended,
    wc_matches_played    = player_stats.wc_matches_played    + excluded.wc_matches_played,
    wc_wins              = player_stats.wc_wins              + excluded.wc_wins,
    wc_losses            = player_stats.wc_losses            + excluded.wc_losses,
    btb_wins             = player_stats.btb_wins             + excluded.btb_wins,
    btb_losses           = player_stats.btb_losses           + excluded.btb_losses,
    btb_draws            = player_stats.btb_draws            + excluded.btb_draws,
    updated_at           = NOW();

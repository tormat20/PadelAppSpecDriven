SELECT
    ps.player_id,
    ps.mexicano_score_total,
    ps.btb_score_total,
    ps.events_attended,
    ps.wc_matches_played,
    ps.wc_wins,
    ps.wc_losses,
    ps.btb_wins,
    ps.btb_losses,
    ps.btb_draws
FROM player_stats ps
WHERE ps.player_id = ?;

SELECT
    ps.player_id,
    ps.mexicano_score_total,
    ps.rb_score_total,
    ps.events_attended,
    ps.wc_matches_played,
    ps.wc_wins,
    ps.wc_losses,
    ps.rb_wins,
    ps.rb_losses,
    ps.rb_draws,
    ps.mexicano_best_event_score,
    ps.event_wins,
    ps.last_win_at,
    ps.americano_score_total,
    ps.team_mexicano_score_total,
    ps.mexicano_events_played,
    ps.team_mexicano_events_played
FROM player_stats ps
WHERE ps.player_id = ?;

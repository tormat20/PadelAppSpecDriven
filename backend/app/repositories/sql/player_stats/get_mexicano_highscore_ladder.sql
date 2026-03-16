SELECT
    ps.player_id,
    p.display_name,
    ps.mexicano_best_event_score
FROM player_stats ps
JOIN players p ON p.id = ps.player_id
WHERE ps.mexicano_best_event_score > 0
ORDER BY ps.mexicano_best_event_score DESC, p.display_name ASC;

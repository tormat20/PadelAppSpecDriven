SELECT event_id, player_id, total_score, rank_position
FROM event_scores
WHERE event_id = ?
ORDER BY total_score DESC, rank_position NULLS LAST;

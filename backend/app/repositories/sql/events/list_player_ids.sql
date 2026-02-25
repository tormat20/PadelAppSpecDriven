SELECT player_id
FROM event_players
WHERE event_id = ?
ORDER BY seed_order NULLS LAST, player_id;

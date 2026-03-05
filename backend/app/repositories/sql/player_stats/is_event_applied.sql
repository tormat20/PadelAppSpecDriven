SELECT COUNT(*) > 0 AS applied
FROM player_stats_event_log
WHERE event_id = ?;

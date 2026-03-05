INSERT INTO player_stats_event_log (event_id)
VALUES (?)
ON CONFLICT (event_id) DO NOTHING;

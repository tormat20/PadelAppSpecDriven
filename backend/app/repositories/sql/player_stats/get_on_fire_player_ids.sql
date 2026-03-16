SELECT ps.player_id
FROM player_stats ps
WHERE ps.last_win_at IS NOT NULL
  AND ps.last_win_at >= NOW() - INTERVAL 7 DAYS;

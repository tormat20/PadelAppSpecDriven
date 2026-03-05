SELECT
    mps.player_id,
    p.display_name,
    mps.events_played,
    mps.mexicano_score,
    mps.rb_score
FROM monthly_player_stats mps
JOIN players p ON p.id = mps.player_id
WHERE mps.year = ?
  AND mps.month = ?
  AND mps.mexicano_score > 0
ORDER BY mps.mexicano_score DESC;

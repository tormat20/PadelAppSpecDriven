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
ORDER BY mps.events_played DESC,
         mps.mexicano_score DESC,
         mps.rb_score DESC;

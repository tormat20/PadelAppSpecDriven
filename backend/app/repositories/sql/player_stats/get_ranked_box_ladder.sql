SELECT
    ps.player_id,
    p.display_name,
    ps.rb_score_total,
    ps.rb_wins,
    ps.rb_losses,
    ps.rb_draws
FROM player_stats ps
JOIN players p ON p.id = ps.player_id
WHERE ps.rb_score_total != 0
   OR ps.rb_wins > 0
   OR ps.rb_losses > 0
   OR ps.rb_draws > 0
ORDER BY ps.rb_score_total DESC,
         ps.rb_wins DESC,
         p.display_name ASC;

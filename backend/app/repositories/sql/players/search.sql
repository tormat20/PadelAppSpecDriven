SELECT id, display_name, global_ranking_score
FROM players
WHERE lower(display_name) LIKE lower(?)
ORDER BY display_name;

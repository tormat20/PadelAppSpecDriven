SELECT p.id, p.display_name, p.global_ranking_score
FROM players p
ORDER BY p.global_ranking_score DESC, p.display_name;

SELECT id, display_name, global_ranking_score, email
FROM players
WHERE lower(email) = lower(?);

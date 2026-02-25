UPDATE players
SET global_ranking_score = global_ranking_score + ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

UPDATE matches
SET winner_team = ?,
    is_draw = ?,
    team1_score = ?,
    team2_score = ?,
    status = 'Completed',
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

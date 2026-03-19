UPDATE players
SET display_name = ?,
    email = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

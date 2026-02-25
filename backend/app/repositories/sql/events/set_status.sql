UPDATE events
SET status = ?, current_round_number = COALESCE(?, current_round_number)
WHERE id = ?;

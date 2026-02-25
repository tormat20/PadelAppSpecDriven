SELECT COUNT(*)
FROM matches
WHERE round_id = ? AND status = 'Pending';

SELECT id, event_id, round_number, status
FROM rounds
WHERE event_id = ?
ORDER BY round_number DESC
LIMIT 1;

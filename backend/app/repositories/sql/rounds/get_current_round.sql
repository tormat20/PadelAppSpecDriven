SELECT id, event_id, round_number, status
FROM rounds
WHERE event_id = ?
ORDER BY
    CASE WHEN status = 'Running' THEN 0 ELSE 1 END,
    round_number DESC
LIMIT 1;

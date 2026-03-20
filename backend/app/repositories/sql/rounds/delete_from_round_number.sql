DELETE FROM matches
WHERE event_id = ?
  AND round_id IN (
    SELECT id FROM rounds WHERE event_id = ? AND round_number >= ?
  );

DELETE FROM rounds
WHERE event_id = ?
  AND round_number >= ?;

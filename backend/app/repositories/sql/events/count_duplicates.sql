SELECT COUNT(*)
FROM events
WHERE LOWER(TRIM(event_name)) = LOWER(TRIM(?))
  AND event_date = ?
  AND COALESCE(event_time, '') = COALESCE(?, '')
  AND id != COALESCE(?, '');

UPDATE events
SET event_name = ?,
    event_type = ?,
    event_date = ?,
    event_time = ?,
    setup_status = ?,
    is_team_mexicano = ?,
    version = version + 1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?
;

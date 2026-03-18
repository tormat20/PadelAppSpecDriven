SELECT id, event_name, event_type, event_date, status,
       round_count, round_duration_minutes, event_duration_minutes, current_round_number,
       event_time, setup_status, version, is_team_mexicano
FROM events
WHERE event_date BETWEEN ? AND ?
ORDER BY event_date ASC, COALESCE(event_time, '00:00') ASC, created_at ASC;

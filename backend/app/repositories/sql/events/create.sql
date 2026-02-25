INSERT INTO events (
  id, event_name, event_type, event_date, status,
  round_count, round_duration_minutes, current_round_number
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

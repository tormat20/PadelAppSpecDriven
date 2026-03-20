INSERT INTO match_result_corrections (
  id,
  event_id,
  match_id,
  edited_by_user_id,
  before_payload,
  after_payload,
  status,
  reason
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

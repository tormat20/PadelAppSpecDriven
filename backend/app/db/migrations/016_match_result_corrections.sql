CREATE TABLE IF NOT EXISTS match_result_corrections (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  edited_by_user_id TEXT NOT NULL,
  before_payload TEXT NOT NULL,
  after_payload TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_match_result_corrections_event
ON match_result_corrections(event_id);

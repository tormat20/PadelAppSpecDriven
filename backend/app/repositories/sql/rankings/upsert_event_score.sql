INSERT INTO event_scores (id, event_id, player_id, total_score, rank_position)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT (event_id, player_id)
DO UPDATE SET
  total_score = excluded.total_score,
  rank_position = excluded.rank_position;

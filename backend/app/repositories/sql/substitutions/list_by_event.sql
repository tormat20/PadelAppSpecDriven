SELECT id, event_id, departing_player_id, substitute_player_id, effective_from_round
FROM event_substitutions
WHERE event_id = ?;

SELECT m.id, m.event_id, m.round_id, m.court_number,
       m.team1_player1_id, m.team1_player2_id,
       m.team2_player1_id, m.team2_player2_id,
       m.result_type, m.winner_team, m.is_draw, m.team1_score, m.team2_score, m.status, m.updated_at,
       r.round_number
FROM matches m
JOIN rounds r ON r.id = m.round_id
WHERE m.event_id = ?
ORDER BY r.round_number ASC, m.court_number ASC;

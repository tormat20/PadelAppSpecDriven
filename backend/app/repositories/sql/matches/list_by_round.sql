SELECT id, event_id, round_id, court_number,
       team1_player1_id, team1_player2_id,
       team2_player1_id, team2_player2_id,
       result_type, winner_team, is_draw, team1_score, team2_score, status
FROM matches
WHERE round_id = ?
ORDER BY court_number;

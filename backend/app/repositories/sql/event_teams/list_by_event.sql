SELECT id, event_id, player1_id, player2_id
FROM event_teams
WHERE event_id = ?
ORDER BY id;


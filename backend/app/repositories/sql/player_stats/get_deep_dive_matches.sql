-- Returns all completed matches for a given player across all finished events.
-- Includes event_type, is_team_mexicano, round_number, court_number,
-- team scores, winner/draw, result_type, and event_date.
-- Used by the deep-dive stats endpoint.

SELECT
    e.event_type,
    COALESCE(e.is_team_mexicano, FALSE) AS is_team_mexicano,
    r.round_number,
    m.court_number,
    m.result_type,
    m.team1_score,
    m.team2_score,
    m.winner_team,
    m.is_draw,
    CASE
        WHEN m.team1_player1_id = ? OR m.team1_player2_id = ? THEN 1
        ELSE 2
    END AS player_team,
    e.event_date,
    e.id AS event_id
FROM matches m
JOIN rounds r ON r.id = m.round_id
JOIN events e ON e.id = m.event_id
WHERE
    m.status = 'Completed'
    AND e.status = 'Finished'
    AND (
        m.team1_player1_id = ?
        OR m.team1_player2_id = ?
        OR m.team2_player1_id = ?
        OR m.team2_player2_id = ?
    )
ORDER BY e.event_date ASC, e.id ASC, r.round_number ASC

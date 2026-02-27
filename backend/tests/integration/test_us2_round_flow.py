def test_us2_round_flow(client):
    players = [
        client.post("/api/v1/players", json={"displayName": f"U2-{i}"}).json()["id"]
        for i in range(8)
    ]
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "US2 Flow",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    ).json()["id"]
    client.post(f"/api/v1/events/{event_id}/start")
    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
    for match in current["matches"]:
        client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json={"mode": "Americano", "winningTeam": 1},
        )
    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200


def test_mexicano_next_round_avoids_immediate_partner_repeat(client):
    players = [
        client.post("/api/v1/players", json={"displayName": f"MX-{i}"}).json()["id"]
        for i in range(8)
    ]
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "US2 Mexicano",
            "eventType": "Mexicano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": players,
        },
    ).json()["id"]
    start = client.post(f"/api/v1/events/{event_id}/start").json()

    def team(match, team_number):
        if f"team{team_number}" in match:
            return match[f"team{team_number}"]
        if team_number == 1:
            return [match["team1_player1_id"], match["team1_player2_id"]]
        return [match["team2_player1_id"], match["team2_player2_id"]]

    def match_id(match):
        return match.get("matchId") or match.get("match_id") or match.get("id")

    def partners(matches):
        partner_map = {}
        for match in matches:
            t1a, t1b = team(match, 1)
            t2a, t2b = team(match, 2)
            partner_map[t1a] = t1b
            partner_map[t1b] = t1a
            partner_map[t2a] = t2b
            partner_map[t2b] = t2a
        return partner_map

    first_partners = partners(start["matches"])
    for match in start["matches"]:
        assert (
            client.post(
                f"/api/v1/matches/{match_id(match)}/result",
                json={"mode": "Mexicano", "team1Score": 17, "team2Score": 7},
            ).status_code
            == 204
        )

    round2 = client.post(f"/api/v1/events/{event_id}/next")
    assert round2.status_code == 200
    second_partners = partners(round2.json()["matches"])
    for player_id, partner_id in first_partners.items():
        assert second_partners[player_id] != partner_id

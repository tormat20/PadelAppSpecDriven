def _make_event(client, event_type: str, prefix: str):
    players = [
        client.post("/api/v1/players", json={"displayName": f"{prefix}-{i}"}).json()["id"]
        for i in range(4)
    ]
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": f"{event_type} Event",
            "eventType": event_type,
            "eventDate": "2026-02-26",
            "selectedCourts": [1],
            "playerIds": players,
        },
    ).json()["id"]
    client.post(f"/api/v1/events/{event_id}/start")
    return event_id


def test_mexicano_and_btb_flows(client):
    mex_event = _make_event(client, "Mexicano", "MX")
    current = client.get(f"/api/v1/events/{mex_event}/rounds/current").json()
    match = current["matches"][0]
    client.post(
        f"/api/v1/matches/{match['matchId']}/result",
        json={"mode": "Mexicano", "team1Score": 17, "team2Score": 7},
    )

    btb_event = _make_event(client, "BeatTheBox", "BTB")
    current_btb = client.get(f"/api/v1/events/{btb_event}/rounds/current").json()
    match_btb = current_btb["matches"][0]
    client.post(
        f"/api/v1/matches/{match_btb['matchId']}/result",
        json={"mode": "BeatTheBox", "outcome": "Draw"},
    )


def test_beat_the_box_partner_cycle_progression(client):
    event_id = _make_event(client, "BeatTheBox", "BTB-C")
    round1 = client.get(f"/api/v1/events/{event_id}/rounds/current").json()
    r1_match = round1["matches"][0]
    quartet = sorted(r1_match["team1"] + r1_match["team2"])

    def match_id(match):
        return match.get("matchId") or match.get("match_id") or match.get("id")

    def team(match, team_number):
        if f"team{team_number}" in match:
            return match[f"team{team_number}"]
        if team_number == 1:
            return [match["team1_player1_id"], match["team1_player2_id"]]
        return [match["team2_player1_id"], match["team2_player2_id"]]

    assert (
        client.post(
            f"/api/v1/matches/{match_id(r1_match)}/result",
            json={"mode": "BeatTheBox", "outcome": "Team1Win"},
        ).status_code
        == 204
    )
    round2 = client.post(f"/api/v1/events/{event_id}/next")
    assert round2.status_code == 200
    r2_match = round2.json()["matches"][0]
    assert set(team(r2_match, 1)) == {quartet[0], quartet[2]}
    assert set(team(r2_match, 2)) == {quartet[1], quartet[3]}

    assert (
        client.post(
            f"/api/v1/matches/{match_id(r2_match)}/result",
            json={"mode": "BeatTheBox", "outcome": "Team1Win"},
        ).status_code
        == 204
    )
    round3 = client.post(f"/api/v1/events/{event_id}/next")
    assert round3.status_code == 200
    r3_match = round3.json()["matches"][0]
    assert set(team(r3_match, 1)) == {quartet[0], quartet[3]}
    assert set(team(r3_match, 2)) == {quartet[1], quartet[2]}

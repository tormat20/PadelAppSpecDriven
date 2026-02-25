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

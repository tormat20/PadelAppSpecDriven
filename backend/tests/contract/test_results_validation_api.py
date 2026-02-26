def _seed_players(client, count=8):
    return [
        client.post("/api/v1/players", json={"displayName": f"RV{i}"}).json()["id"]
        for i in range(count)
    ]


def test_reject_invalid_mexicano_score_payload(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Result Validation",
            "eventType": "Mexicano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    current = client.post(f"/api/v1/events/{event_id}/start").json()
    match_id = current["matches"][0].get("matchId") or current["matches"][0].get("match_id")

    bad = client.post(
        f"/api/v1/matches/{match_id}/result",
        json={"mode": "Mexicano", "team1Score": 10, "team2Score": 10},
    )
    assert bad.status_code == 400

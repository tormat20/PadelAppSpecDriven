def _seed_players(client, prefix: str, count: int = 8) -> list[str]:
    return [
        client.post("/api/v1/players", json={"displayName": f"{prefix}-{index}"}).json()["id"]
        for index in range(count)
    ]


def test_event_flow_and_crowns_remain_valid_with_ranking_metadata(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Ranking Regression Flow",
            "eventType": "Americano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1, 2],
            "playerIds": _seed_players(client, "RRF", 8),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    expected_crowned: list[str] = []

    for round_number in range(1, 7):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current.status_code == 200
        matches = current.json()["matches"]
        highest_court = max(match["courtNumber"] for match in matches)

        for match in matches:
            winning_team = 2 if (round_number == 6 and match["courtNumber"] == highest_court) else 1
            if round_number == 6 and match["courtNumber"] == highest_court:
                expected_crowned = match["team2"]

            submitted = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "Americano", "winningTeam": winning_team},
            )
            assert submitted.status_code == 204

        if round_number < 6:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200

    summary = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary.status_code == 200
    payload = summary.json()

    assert payload["mode"] == "final"
    assert payload["orderingVersion"] == "v1"
    assert sorted(payload["crownedPlayerIds"]) == sorted(expected_crowned)
    assert len(payload["playerRows"]) == 8

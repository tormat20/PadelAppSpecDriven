def _seed_players(client, prefix: str, count: int = 8) -> list[str]:
    return [
        client.post("/api/v1/players", json={"displayName": f"{prefix}-{index}"}).json()["id"]
        for index in range(count)
    ]


def test_americano_crowns_follow_highest_court_in_final_round(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Crown Resolution",
            "eventType": "Americano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1, 2],
            "playerIds": _seed_players(client, "ACR", 8),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    for round_number in range(1, 7):
        current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current_round.status_code == 200
        matches = current_round.json()["matches"]
        highest_court = max(match["courtNumber"] for match in matches)

        expected_crowned: list[str] = []
        for match in matches:
            if round_number == 6 and match["courtNumber"] == highest_court:
                winning_team = 2
                expected_crowned = list(match["team2"])
            else:
                winning_team = 1

            result = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "Americano", "winningTeam": winning_team},
            )
            assert result.status_code == 204

        if round_number < 6:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200

    summary = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary.status_code == 200
    payload = summary.json()
    assert payload["mode"] == "final"
    assert sorted(payload["crownedPlayerIds"]) == sorted(expected_crowned)

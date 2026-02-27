def _seed_players(client, prefix: str, count: int = 4) -> list[str]:
    player_ids: list[str] = []
    for index in range(count):
        created = client.post("/api/v1/players", json={"displayName": f"{prefix}-{index}"})
        player_ids.append(created.json()["id"])
    return player_ids


def test_mexicano_final_ties_use_competition_ranking(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Mexicano Competition Rank",
            "eventType": "Mexicano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1],
            "playerIds": _seed_players(client, "MCR", 4),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    for round_number in range(1, 7):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current.status_code == 200
        for match in current.json()["matches"]:
            submitted = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "Mexicano", "team1Score": 12, "team2Score": 12},
            )
            assert submitted.status_code == 204

        if round_number < 6:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200

    summary = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary.status_code == 200
    payload = summary.json()

    ranks = [row["rank"] for row in payload["playerRows"]]
    assert set(ranks) == {1}

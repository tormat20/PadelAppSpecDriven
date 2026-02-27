def _seed_players(client, prefix: str, count: int = 4) -> list[str]:
    ids = []
    for index in range(count):
        created = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}{index}"},
        )
        ids.append(created.json()["id"])
    return ids


def test_progress_summary_returns_ranked_rows(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Progress Ranking Contract",
            "eventType": "Americano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1],
            "playerIds": _seed_players(client, "PRC", 4),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
    match = current_round.json()["matches"][0]
    submitted = client.post(
        f"/api/v1/matches/{match['matchId']}/result",
        json={"mode": "Americano", "winningTeam": 1},
    )
    assert submitted.status_code == 204

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200
    payload = summary_response.json()

    assert payload["mode"] == "progress"
    assert payload["orderingMode"] == "progress-score-desc"
    assert payload["orderingVersion"] == "v1"
    assert payload["columns"][-1]["label"] == "Total"
    assert all("rank" in row for row in payload["playerRows"])
    ranks = [row["rank"] for row in payload["playerRows"]]
    assert ranks == sorted(ranks)

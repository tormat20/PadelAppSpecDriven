def _seed_players(client, prefix: str, count: int = 8) -> list[str]:
    player_ids: list[str] = []
    for index in range(count):
        created = client.post("/api/v1/players", json={"displayName": f"{prefix}-{index}"})
        player_ids.append(created.json()["id"])
    return player_ids


def test_btb_final_summary_shows_numeric_points_totals_and_rank_order(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "BTB Final Ordering",
            "eventType": "BeatTheBox",
            "eventDate": "2026-02-27",
            "selectedCourts": [1, 2],
            "playerIds": _seed_players(client, "BTBO", 8),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    for round_number in range(1, 4):
        current = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current.status_code == 200
        matches = sorted(
            current.json()["matches"], key=lambda match: match["courtNumber"], reverse=True
        )

        for index, match in enumerate(matches):
            outcome = "Team1Win" if index == 0 else "Team2Win"
            submitted = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "BeatTheBox", "outcome": outcome},
            )
            assert submitted.status_code == 204

        if round_number < 3:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200

    summary = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary.status_code == 200
    payload = summary.json()

    assert payload["mode"] == "final"
    assert payload["orderingMode"] == "final-btb-global-court-groups"
    assert payload["columns"][-1]["id"] == "total"

    totals: list[int] = []
    for row in payload["playerRows"]:
        numeric_rounds = [
            int(cell["value"]) for cell in row["cells"] if cell["columnId"].startswith("round-")
        ]
        total_cell = next(cell for cell in row["cells"] if cell["columnId"] == "total")
        total_value = int(total_cell["value"])
        totals.append(total_value)
        assert sum(numeric_rounds) == total_value

    assert [row["rank"] for row in payload["playerRows"]] == list(
        range(1, len(payload["playerRows"]) + 1)
    )
    assert min(totals[:4]) >= max(totals[4:])

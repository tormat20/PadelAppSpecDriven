def _seed_players(client, prefix: str, count: int) -> list[str]:
    ids = []
    for index in range(count):
        response = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}-{index:02d}"},
        )
        ids.append(response.json()["id"])
    return ids


def _create_event(
    client, event_type: str, name: str, player_ids: list[str], courts: list[int]
) -> str:
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": name,
            "eventType": event_type,
            "eventDate": "2026-02-27",
            "selectedCourts": courts,
            "playerIds": player_ids,
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    return event_id


def _complete_event(client, event_id: str, mode: str, round_count: int) -> None:
    for round_number in range(1, round_count + 1):
        current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current_round.status_code == 200

        for match in current_round.json()["matches"]:
            if mode == "Mexicano":
                payload = {"mode": "Mexicano", "team1Score": 12, "team2Score": 12}
            elif mode == "Americano":
                payload = {"mode": "Americano", "winningTeam": 1}
            else:
                payload = {"mode": "BeatTheBox", "outcome": "Team1Win"}

            result = client.post(f"/api/v1/matches/{match['matchId']}/result", json=payload)
            assert result.status_code == 204

        if round_number < round_count:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200


def test_final_summary_exposes_rank_and_ordering_metadata(client):
    event_id = _create_event(
        client,
        "Americano",
        "Final Ranking Contract",
        _seed_players(client, "FRC", 8),
        [1, 2],
    )
    _complete_event(client, event_id, "Americano", 6)

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200
    payload = summary_response.json()

    assert payload["mode"] == "final"
    assert payload["orderingMode"] == "final-americano-court-priority"
    assert payload["orderingVersion"] == "v1"
    assert payload["columns"][-1]["label"] == "Total"
    assert all("rank" in row for row in payload["playerRows"])
    assert [row["rank"] for row in payload["playerRows"]] == list(
        range(1, len(payload["playerRows"]) + 1)
    )


def test_mexicano_final_uses_competition_rank_for_ties(client):
    event_id = _create_event(
        client,
        "Mexicano",
        "Mexicano Tie Rank Contract",
        _seed_players(client, "MRC", 4),
        [1],
    )
    _complete_event(client, event_id, "Mexicano", 6)

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200
    payload = summary_response.json()

    assert payload["mode"] == "final"
    assert payload["orderingMode"] == "final-mexicano-total-desc"
    assert all(row["rank"] == 1 for row in payload["playerRows"])

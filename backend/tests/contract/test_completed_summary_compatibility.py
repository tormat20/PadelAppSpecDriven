def _seed_players(client, prefix, count=4):
    ids = []
    for index in range(count):
        response = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}{index}"},
        )
        ids.append(response.json()["id"])
    return ids


def _complete_beat_the_box_event(client, event_id: str):
    for round_number in range(1, 4):
        current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current_round.status_code == 200

        for match in current_round.json()["matches"]:
            result = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "BeatTheBox", "outcome": "Team1Win"},
            )
            assert result.status_code == 204

        if round_number < 3:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200


def test_completed_summary_route_remains_compatible(client):
    player_ids = _seed_players(client, "CS")
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Completed Summary Contract",
            "eventType": "BeatTheBox",
            "eventDate": "2026-02-26",
            "selectedCourts": [1],
            "playerIds": player_ids,
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    _complete_beat_the_box_event(client, event_id)

    finish_response = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_response.status_code == 200
    legacy_payload = finish_response.json()
    assert "finalStandings" in legacy_payload
    assert "matches" in legacy_payload

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200
    payload = summary_response.json()
    assert payload["mode"] == "final"
    assert "finalStandings" in payload
    assert "matches" in payload
    labels = [column["label"] for column in payload["columns"]]
    assert labels[-1] == "Total"
    assert all(label.startswith("R") for label in labels[:-1])
    for row in payload["playerRows"]:
        numeric_cells = row["cells"][:-1]
        assert all(cell["value"].lstrip("-").isdigit() for cell in numeric_cells)

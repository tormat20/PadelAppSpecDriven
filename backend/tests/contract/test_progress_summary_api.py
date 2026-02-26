def _seed_players(client, prefix, count=4):
    ids = []
    for index in range(count):
        response = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}{index}"},
        )
        ids.append(response.json()["id"])
    return ids


def test_in_progress_summary_returns_progress_matrix(client):
    player_ids = _seed_players(client, "PS")
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Progress Summary Contract",
            "eventType": "BeatTheBox",
            "eventDate": "2026-02-26",
            "selectedCourts": [1],
            "playerIds": player_ids,
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200

    payload = summary_response.json()
    assert payload["mode"] == "progress"
    assert payload["eventId"] == event_id
    assert len(payload["playerRows"]) == 4
    assert len(payload["columns"]) >= 1
    assert all(cell["value"] == "-" for cell in payload["playerRows"][0]["cells"])

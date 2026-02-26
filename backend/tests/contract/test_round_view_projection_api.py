def _seed_players(client, count=8):
    player_ids = []
    for i in range(count):
        created = client.post("/api/v1/players", json={"displayName": f"V{i}"})
        player_ids.append(created.json()["id"])
    return player_ids


def test_current_round_projection_contains_courts_and_matches(client):
    player_ids = _seed_players(client)
    event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Projection Test",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()
    event_id = event["id"]

    started = client.post(f"/api/v1/events/{event_id}/start")
    assert started.status_code == 200

    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    payload = current.json()

    payload_event_id = payload.get("event_id") or payload.get("eventId")
    payload_round_number = payload.get("round_number") or payload.get("roundNumber")
    matches = payload.get("matches", [])

    assert payload_event_id == event_id
    assert payload_round_number == 1
    assert isinstance(matches, list)
    assert len(matches) == 2

    for match in matches:
        assert "court_number" in match or "courtNumber" in match
        assert "team1" in match or "teamA" in match
        assert "team2" in match or "teamB" in match

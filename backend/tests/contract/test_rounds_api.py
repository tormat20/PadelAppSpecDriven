def _seed_players(client, count=8):
    return [
        client.post("/api/v1/players", json={"displayName": f"Q{i}"}).json()["id"]
        for i in range(count)
    ]


def _match_id(match: dict) -> str:
    value = match.get("matchId") or match.get("match_id") or match.get("id")
    assert isinstance(value, str)
    return value


def test_rounds_current_and_next_behaviors(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Rounds",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    current = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current.status_code == 200
    assert "matches" in current.json()

    blocked = client.post(f"/api/v1/events/{event_id}/next")
    assert blocked.status_code == 409


def test_previous_round_returns_blocked_warning_on_round_one(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Previous Round Boundary",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    response = client.post(f"/api/v1/events/{event_id}/previous")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["roundView"] is None
    assert payload["warningMessage"]


def test_previous_round_loads_prior_round_and_discards_downstream(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Previous Round Success",
            "eventType": "WinnersCourt",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]

    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    for match in current["matches"]:
        result = client.post(
            f"/api/v1/matches/{_match_id(match)}/result",
            json={"mode": "WinnersCourt", "winningTeam": 1},
        )
        assert result.status_code == 204

    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200

    response = client.post(f"/api/v1/events/{event_id}/previous")
    assert response.status_code == 200

    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["warningMessage"] is None
    assert payload["roundView"]["roundNumber"] == 1

    current_after = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current_after.status_code == 200
    assert current_after.json()["roundNumber"] == 1

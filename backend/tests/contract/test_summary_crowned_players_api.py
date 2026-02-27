def _seed_players(client, prefix: str, count: int) -> list[str]:
    ids = []
    for index in range(count):
        response = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}{index}"},
        )
        ids.append(response.json()["id"])
    return ids


def _play_round(client, event_id: str, mode: str, round_number: int, total_rounds: int) -> None:
    current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current_round.status_code == 200

    for match in current_round.json()["matches"]:
        if mode == "Mexicano":
            result = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "Mexicano", "team1Score": 12, "team2Score": 12},
            )
        elif mode == "Americano":
            result = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "Americano", "winningTeam": 1},
            )
        else:
            result = client.post(
                f"/api/v1/matches/{match['matchId']}/result",
                json={"mode": "BeatTheBox", "outcome": "Team1Win"},
            )
        assert result.status_code == 204

    if round_number < total_rounds:
        advanced = client.post(f"/api/v1/events/{event_id}/next")
        assert advanced.status_code == 200


def _create_and_complete_event(client, event_type: str, prefix: str, player_count: int) -> str:
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": f"{event_type} Crown Contract",
            "eventType": event_type,
            "eventDate": "2026-02-27",
            "selectedCourts": [1, 2] if player_count >= 8 else [1],
            "playerIds": _seed_players(client, prefix, player_count),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    total_rounds = 3 if event_type == "BeatTheBox" else 6
    for round_number in range(1, total_rounds + 1):
        _play_round(client, event_id, event_type, round_number, total_rounds)
    return event_id


def test_final_summary_includes_crowned_player_ids_for_modes(client):
    mexicano_event = _create_and_complete_event(client, "Mexicano", "MXC", 4)
    americano_event = _create_and_complete_event(client, "Americano", "AMC", 8)
    btb_event = _create_and_complete_event(client, "BeatTheBox", "BTC", 4)

    mexicano_summary = client.get(f"/api/v1/events/{mexicano_event}/summary")
    assert mexicano_summary.status_code == 200
    mexicano_payload = mexicano_summary.json()
    assert mexicano_payload["mode"] == "final"
    assert "crownedPlayerIds" in mexicano_payload
    assert len(mexicano_payload["crownedPlayerIds"]) >= 1

    americano_summary = client.get(f"/api/v1/events/{americano_event}/summary")
    assert americano_summary.status_code == 200
    americano_payload = americano_summary.json()
    assert americano_payload["mode"] == "final"
    assert "crownedPlayerIds" in americano_payload
    assert len(americano_payload["crownedPlayerIds"]) == 2

    btb_summary = client.get(f"/api/v1/events/{btb_event}/summary")
    assert btb_summary.status_code == 200
    btb_payload = btb_summary.json()
    assert btb_payload["mode"] == "final"
    assert btb_payload["crownedPlayerIds"] == []


def test_progress_summary_does_not_render_crowns(client):
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Progress Crown Contract",
            "eventType": "Americano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1],
            "playerIds": _seed_players(client, "PRC", 4),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    summary_response = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary_response.status_code == 200
    payload = summary_response.json()
    assert payload["mode"] == "progress"
    assert "crownedPlayerIds" not in payload

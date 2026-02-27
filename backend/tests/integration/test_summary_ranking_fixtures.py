def seed_players(client, prefix: str, count: int) -> list[str]:
    player_ids: list[str] = []
    for index in range(count):
        response = client.post(
            "/api/v1/players",
            json={"displayName": f"{prefix}-{index:02d}"},
        )
        player_ids.append(response.json()["id"])
    return player_ids


def create_event(
    client, event_type: str, event_name: str, player_ids: list[str], courts: list[int]
) -> str:
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": event_name,
            "eventType": event_type,
            "eventDate": "2026-02-27",
            "selectedCourts": courts,
            "playerIds": player_ids,
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200
    return event_id


def play_round_with_payloads(client, event_id: str, payload_for_match) -> list[dict]:
    current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
    assert current_round.status_code == 200
    matches = current_round.json()["matches"]
    for match in matches:
        payload = payload_for_match(match)
        result = client.post(
            f"/api/v1/matches/{match['matchId']}/result",
            json=payload,
        )
        assert result.status_code == 204
    return matches


def advance_round(client, event_id: str) -> None:
    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200


def complete_event(client, event_id: str, rounds: int, payload_for_match) -> None:
    for round_number in range(1, rounds + 1):
        play_round_with_payloads(client, event_id, payload_for_match)
        if round_number < rounds:
            advance_round(client, event_id)

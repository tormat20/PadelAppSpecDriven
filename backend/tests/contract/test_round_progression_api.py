def _seed_players(client, count=8):
    player_ids = []
    for i in range(count):
        player_ids.append(
            client.post("/api/v1/players", json={"displayName": f"R{i}"}).json()["id"]
        )
    return player_ids


def _match_id(match: dict) -> str:
    value = match.get("matchId") or match.get("match_id") or match.get("id")
    assert isinstance(value, str)
    return value


def _team(match: dict, team_number: int) -> list[str]:
    if f"team{team_number}" in match:
        return match[f"team{team_number}"]
    if team_number == 1:
        return [match["team1_player1_id"], match["team1_player2_id"]]
    return [match["team2_player1_id"], match["team2_player2_id"]]


def _court(match: dict) -> int:
    value = match.get("courtNumber") or match.get("court_number")
    assert isinstance(value, int)
    return value


def test_submit_result_and_next(client):
    player_ids = _seed_players(client)
    event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Round Test",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()
    event_id = event["id"]
    client.post(f"/api/v1/events/{event_id}/start")
    current = client.get(f"/api/v1/events/{event_id}/rounds/current").json()

    blocked = client.post(f"/api/v1/events/{event_id}/next")
    assert blocked.status_code == 400

    for match in current["matches"]:
        result = client.post(
            f"/api/v1/matches/{_match_id(match)}/result",
            json={"mode": "Americano", "winningTeam": 1},
        )
        assert result.status_code == 204

    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200
    assert advanced.json()["round_number"] == 2


def test_americano_next_round_moves_winners_and_losers(client):
    player_ids = _seed_players(client)
    event_id = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Movement",
            "eventType": "Americano",
            "eventDate": "2026-02-26",
            "selectedCourts": [1, 2],
            "playerIds": player_ids,
        },
    ).json()["id"]
    current = client.post(f"/api/v1/events/{event_id}/start").json()

    first_match, second_match = current["matches"]
    assert (
        client.post(
            f"/api/v1/matches/{_match_id(first_match)}/result",
            json={"mode": "Americano", "winningTeam": 1},
        ).status_code
        == 204
    )
    assert (
        client.post(
            f"/api/v1/matches/{_match_id(second_match)}/result",
            json={"mode": "Americano", "winningTeam": 2},
        ).status_code
        == 204
    )

    advanced = client.post(f"/api/v1/events/{event_id}/next")
    assert advanced.status_code == 200
    by_court = {
        _court(match): set(_team(match, 1) + _team(match, 2))
        for match in advanced.json()["matches"]
    }
    assert by_court[1] == set(_team(first_match, 2) + _team(second_match, 1))
    assert by_court[2] == set(_team(first_match, 1) + _team(second_match, 2))


def test_next_round_assignment_is_deterministic_for_same_inputs(client):
    player_ids = _seed_players(client)

    def create_and_advance(event_name: str):
        event_id = client.post(
            "/api/v1/events",
            json={
                "eventName": event_name,
                "eventType": "Americano",
                "eventDate": "2026-02-26",
                "selectedCourts": [1, 2],
                "playerIds": player_ids,
            },
        ).json()["id"]
        current = client.post(f"/api/v1/events/{event_id}/start").json()
        first_match, second_match = current["matches"]
        client.post(
            f"/api/v1/matches/{_match_id(first_match)}/result",
            json={"mode": "Americano", "winningTeam": 1},
        )
        client.post(
            f"/api/v1/matches/{_match_id(second_match)}/result",
            json={"mode": "Americano", "winningTeam": 2},
        )
        next_round = client.post(f"/api/v1/events/{event_id}/next").json()
        return {
            _court(match): sorted(_team(match, 1) + _team(match, 2))
            for match in next_round["matches"]
        }

    assignment_one = create_and_advance("Determinism A")
    assignment_two = create_and_advance("Determinism B")
    assert assignment_one == assignment_two

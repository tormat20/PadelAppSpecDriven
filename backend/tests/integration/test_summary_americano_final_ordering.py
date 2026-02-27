def _create_players_with_names(client, names: list[str]) -> dict[str, str]:
    player_by_id: dict[str, str] = {}
    for name in names:
        created = client.post("/api/v1/players", json={"displayName": name})
        player_by_id[created.json()["id"]] = name
    return player_by_id


def test_americano_final_ordering_is_court_priority_with_alphabetical_pairs(client):
    players = _create_players_with_names(
        client,
        ["Zoe", "Amy", "Nils", "Bo", "Yara", "Iris", "Karl", "Ola"],
    )
    created = client.post(
        "/api/v1/events",
        json={
            "eventName": "Americano Final Ordering",
            "eventType": "Americano",
            "eventDate": "2026-02-27",
            "selectedCourts": [1, 2],
            "playerIds": list(players.keys()),
        },
    )
    event_id = created.json()["id"]
    assert client.post(f"/api/v1/events/{event_id}/start").status_code == 200

    expected_order: list[str] = []

    for round_number in range(1, 7):
        current_round = client.get(f"/api/v1/events/{event_id}/rounds/current")
        assert current_round.status_code == 200
        matches = current_round.json()["matches"]

        final_round_matches = sorted(matches, key=lambda match: match["courtNumber"], reverse=True)
        if round_number == 6:
            for index, match in enumerate(final_round_matches):
                winning_team = 2 if index == 0 else 1

                winners = match["team2"] if winning_team == 2 else match["team1"]
                losers = match["team1"] if winning_team == 2 else match["team2"]
                winners_sorted = sorted(winners, key=lambda player_id: players[player_id])
                losers_sorted = sorted(losers, key=lambda player_id: players[player_id])
                expected_order.extend(winners_sorted)
                expected_order.extend(losers_sorted)

                result = client.post(
                    f"/api/v1/matches/{match['matchId']}/result",
                    json={"mode": "Americano", "winningTeam": winning_team},
                )
                assert result.status_code == 204
        else:
            for match in matches:
                result = client.post(
                    f"/api/v1/matches/{match['matchId']}/result",
                    json={"mode": "Americano", "winningTeam": 1},
                )
                assert result.status_code == 204

        if round_number < 6:
            advanced = client.post(f"/api/v1/events/{event_id}/next")
            assert advanced.status_code == 200

    summary = client.get(f"/api/v1/events/{event_id}/summary")
    assert summary.status_code == 200
    payload = summary.json()
    ranked_ids = [row["playerId"] for row in payload["playerRows"]]

    assert ranked_ids == expected_order
    assert [row["rank"] for row in payload["playerRows"]] == list(range(1, 9))

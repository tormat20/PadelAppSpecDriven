def _seed_players(client, prefix, count=4):
    ids = []
    for i in range(count):
        ids.append(
            client.post("/api/v1/players", json={"displayName": f"{prefix}{i}"}).json()["id"]
        )
    return ids


def test_finish_requires_final_round(client):
    player_ids = _seed_players(client, "F")
    event = client.post(
        "/api/v1/events",
        json={
            "eventName": "Finish Test",
            "eventType": "BeatTheBox",
            "eventDate": "2026-02-26",
            "selectedCourts": [1],
            "playerIds": player_ids,
        },
    ).json()
    event_id = event["id"]
    client.post(f"/api/v1/events/{event_id}/start")

    finish_early = client.post(f"/api/v1/events/{event_id}/finish")
    assert finish_early.status_code == 400

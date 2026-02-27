def test_create_and_get_player(client):
    created = client.post("/api/v1/players", json={"displayName": "alice"})
    assert created.status_code == 201
    player = created.json()
    assert player["displayName"] == "Alice"
    fetched = client.get(f"/api/v1/players/{player['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["displayName"] == "Alice"


def test_search_players(client):
    client.post("/api/v1/players", json={"displayName": "Bob"})
    client.post("/api/v1/players", json={"displayName": "Bobby"})
    response = client.get("/api/v1/players", params={"query": "Bob"})
    assert response.status_code == 200
    assert len(response.json()) >= 2

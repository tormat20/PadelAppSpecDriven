from database.connection import get_connection

def test_full_match_flow(conn, repos, players):


    box_id = repos["boxes"].create(event_id=1)

    match_repo = repos["matches"]

    team1 = players[:2]
    team2 = players[2:]

    # Create match
    match_id = match_repo.create(box_id)
    match_repo.add_team(match_id, team1, team=1)
    match_repo.add_team(match_id, team2, team=2)

    # --- Verify teams ---
    t1 = match_repo.get_team(match_id, 1)
    t2 = match_repo.get_team(match_id, 2)

    assert len(t1) == 2
    assert len(t2) == 2
    assert {p.name for p in t1} == {"Alice", "Bob"}
    assert {p.name for p in t2} == {"Charlie", "Diana"}

    # --- Partner ---
    partner = match_repo.get_partner(match_id, players[0].id)
    assert partner.name == "Bob"

    # --- Opposite team ---
    opponents = match_repo.get_opposite_team(match_id, players[0].id)
    assert {p.name for p in opponents} == {"Charlie", "Diana"}

    # --- Set result ---
    match_repo.set_result(match_id, winning_team=1)
    assert match_repo.get_result(match_id) == 1

    # --- Load full match ---
    match = match_repo.get_match(match_id)

    assert match.id == match_id
    assert match.box_id == box_id
    assert match.winning_team == 1
    assert len(match.team1) == 2
    assert len(match.team2) == 2


from services.match_services import MatchSerivce


def test_match_service_setup_and_win(conn, repos, players):
    service = MatchSerivce(
        event_repo=None,
        box_repo=repos["boxes"],
        match_repo=repos["matches"],
        player_repo=repos["players"],
    )

    box_id = repos["boxes"].create(event_id=1)

    match_id = service.setup_match(
        box_id,
        team1_players=players[:2],
        team2_players=players[2:]
    )

    service.set_win(match_id, team=2)

    result = repos["matches"].get_result(match_id)
    assert result == 2

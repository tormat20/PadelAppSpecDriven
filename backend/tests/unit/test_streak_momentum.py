from types import SimpleNamespace

from app.services.summary_ordering import compute_consecutive_momentum


def _match(
    court_number: int,
    winner_team: int | None,
    is_draw: bool,
    t1: tuple[str, str],
    t2: tuple[str, str],
):
    return SimpleNamespace(
        court_number=court_number,
        winner_team=winner_team,
        is_draw=is_draw,
        team1_player1_id=t1[0],
        team1_player2_id=t1[1],
        team2_player1_id=t2[0],
        team2_player2_id=t2[1],
    )


def test_draws_do_not_break_existing_hot_streak():
    # p1/p2 win, draw 12/12, then win twice more -> still hot
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p1"] == "fire"
    assert momentum["p2"] == "fire"


def test_three_or_more_consecutive_losses_produce_snowflake():
    # p3/p4 lose four in a row
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p3"] == "snowflake"
    assert momentum["p4"] == "snowflake"

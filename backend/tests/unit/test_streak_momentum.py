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


def test_opposite_outcome_clears_an_existing_streak():
    # p1/p2 win three, then lose once -> badge should disappear next round
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, 2, False, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p1"] == "none"
    assert momentum["p2"] == "none"


def test_neutral_round_keeps_active_streak_but_does_not_create_one():
    # p1/p2 win three, play a neutral 12, then win once more -> still hot.
    # p3/p4 lose three, play a neutral 12, then lose once more -> still cold.
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
        (5, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p1"] == "fire"
    assert momentum["p2"] == "fire"
    assert momentum["p3"] == "snowflake"
    assert momentum["p4"] == "snowflake"


def test_draw_only_does_not_create_streak():
    # p1/p2 and p3/p4 only play draws -> no badge for anyone.
    matches = [
        (1, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum.get("p1", "none") == "none"
    assert momentum.get("p2", "none") == "none"
    assert momentum.get("p3", "none") == "none"
    assert momentum.get("p4", "none") == "none"


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


def test_12_draw_after_fire_streak_preserves_badge():
    # User scenario: 3 wins -> fire badge, then score 12 in round 4 (draw),
    # go to round 5 -> fire badge must still be shown.
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, None, True, ("p1", "p2"), ("p3", "p4"))),  # 12/12 draw
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p1"] == "fire", "fire streak should survive a 12/12 draw"
    assert momentum["p2"] == "fire", "fire streak should survive a 12/12 draw"
    assert momentum["p3"] == "snowflake", "snowflake streak should survive a 12/12 draw"
    assert momentum["p4"] == "snowflake", "snowflake streak should survive a 12/12 draw"


def test_six_consecutive_wins_still_fire_at_round_6():
    # User scenario: 6 consecutive wins -> fire badge must still appear
    # after all 6 rounds are completed (streak_count >= 3).
    matches = [
        (1, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (2, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (3, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (4, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (5, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
        (6, _match(1, 1, False, ("p1", "p2"), ("p3", "p4"))),
    ]

    momentum = compute_consecutive_momentum(matches)
    assert momentum["p1"] == "fire", "6 consecutive wins must produce fire"
    assert momentum["p2"] == "fire", "6 consecutive wins must produce fire"
    assert momentum["p3"] == "snowflake", "6 consecutive losses must produce snowflake"
    assert momentum["p4"] == "snowflake", "6 consecutive losses must produce snowflake"

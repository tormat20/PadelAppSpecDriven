from app.domain.enums import EventType, MatchStatus, ResultType
from app.domain.models import Match
from app.domain.scheduling import generate_next_round, generate_round_1


def test_generate_round_1():
    players = [f"p{i}" for i in range(8)]
    plan = generate_round_1(EventType.AMERICANO, players, [2, 1])
    assert plan.round_number == 1
    assert len(plan.matches) == 2
    assert plan.matches[0].court_number == 1
    assert plan.matches[1].court_number == 2


def test_generate_next_round_for_mexicano_uses_top_courts_and_avoids_repeat_partner():
    players = [f"p{i}" for i in range(8)]
    partner_history = {
        "p0": "p1",
        "p1": "p0",
        "p2": "p3",
        "p3": "p2",
    }
    plan = generate_next_round(
        EventType.MEXICANO,
        1,
        players,
        [1, 2, 3],
        partner_history=partner_history,
    )

    assert plan.round_number == 2
    assert len(plan.matches) == 2
    assert [m.court_number for m in plan.matches] == [2, 3]

    top_match = plan.matches[1]
    assert set(top_match.team1) != {"p0", "p1"}


def test_generate_next_round_for_americano_respects_movement_and_bounds():
    previous_matches = [
        Match(
            id="m1",
            event_id="evt",
            round_id="r1",
            court_number=1,
            team1_player1_id="p1",
            team1_player2_id="p2",
            team2_player1_id="p3",
            team2_player2_id="p4",
            result_type=ResultType.WIN_LOSS,
            winner_team=1,
            is_draw=False,
            team1_score=None,
            team2_score=None,
            status=MatchStatus.COMPLETED,
        ),
        Match(
            id="m2",
            event_id="evt",
            round_id="r1",
            court_number=2,
            team1_player1_id="p5",
            team1_player2_id="p6",
            team2_player1_id="p7",
            team2_player2_id="p8",
            result_type=ResultType.WIN_LOSS,
            winner_team=2,
            is_draw=False,
            team1_score=None,
            team2_score=None,
            status=MatchStatus.COMPLETED,
        ),
    ]

    plan = generate_next_round(
        EventType.AMERICANO,
        1,
        [f"p{i}" for i in range(1, 9)],
        [1, 2],
        previous_matches=previous_matches,
        event_seed="evt:2",
    )

    assert plan.round_number == 2
    assert len(plan.matches) == 2
    by_court = {match.court_number: match for match in plan.matches}
    assert set(by_court[1].team1 + by_court[1].team2) == {"p3", "p4", "p5", "p6"}
    assert set(by_court[2].team1 + by_court[2].team2) == {"p1", "p2", "p7", "p8"}


def test_generate_next_round_for_beat_the_box_uses_fixed_cycle():
    previous_matches = [
        Match(
            id="m1",
            event_id="evt",
            round_id="r1",
            court_number=4,
            team1_player1_id="A",
            team1_player2_id="B",
            team2_player1_id="C",
            team2_player2_id="D",
            result_type=ResultType.WIN_LOSS_DRAW,
            winner_team=1,
            is_draw=False,
            team1_score=None,
            team2_score=None,
            status=MatchStatus.COMPLETED,
        )
    ]

    round2 = generate_next_round(
        EventType.BEAT_THE_BOX,
        1,
        ["A", "B", "C", "D"],
        [4],
        previous_matches=previous_matches,
    )
    assert set(round2.matches[0].team1) == {"A", "C"}
    assert set(round2.matches[0].team2) == {"B", "D"}

    round3 = generate_next_round(
        EventType.BEAT_THE_BOX,
        2,
        ["A", "B", "C", "D"],
        [4],
        previous_matches=previous_matches,
    )
    assert set(round3.matches[0].team1) == {"A", "D"}
    assert set(round3.matches[0].team2) == {"B", "C"}

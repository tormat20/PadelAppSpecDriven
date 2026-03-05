import pytest

from app.domain.scoring import winners_court_score, ranked_box_delta, mexicano_score


def test_winners_court_score():
    assert winners_court_score(1) == (1, 0)
    assert winners_court_score(2) == (0, 1)


def test_mexicano_score_validation():
    assert mexicano_score(17, 7) == (17, 7)
    with pytest.raises(ValueError):
        mexicano_score(20, 3)


def test_ranked_box_deltas():
    assert ranked_box_delta("Team1Win") == (25, -15)
    assert ranked_box_delta("Team2Win") == (-15, 25)
    assert ranked_box_delta("Draw") == (5, 5)

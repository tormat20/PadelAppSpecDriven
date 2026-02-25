import pytest

from app.domain.scoring import americano_score, beat_the_box_delta, mexicano_score


def test_americano_score():
    assert americano_score(1) == (1, 0)
    assert americano_score(2) == (0, 1)


def test_mexicano_score_validation():
    assert mexicano_score(17, 7) == (17, 7)
    with pytest.raises(ValueError):
        mexicano_score(20, 3)


def test_beat_the_box_deltas():
    assert beat_the_box_delta("Team1Win") == (25, -15)
    assert beat_the_box_delta("Team2Win") == (-15, 25)
    assert beat_the_box_delta("Draw") == (5, 5)

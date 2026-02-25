from app.domain.enums import EventType
from app.domain.scheduling import generate_next_round, generate_round_1


def test_generate_round_1():
    players = [f"p{i}" for i in range(8)]
    plan = generate_round_1(EventType.AMERICANO, players, [1, 2])
    assert plan.round_number == 1
    assert len(plan.matches) == 2


def test_generate_next_round():
    players = [f"p{i}" for i in range(8)]
    plan = generate_next_round(EventType.MEXICANO, 1, players, [1, 2])
    assert plan.round_number == 2
    assert len(plan.matches) == 2

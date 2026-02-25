from app.domain.enums import EventType


def americano_score(winning_team: int) -> tuple[int, int]:
    if winning_team not in (1, 2):
        raise ValueError("winning_team must be 1 or 2")
    return (1, 0) if winning_team == 1 else (0, 1)


def mexicano_score(team1_score: int, team2_score: int) -> tuple[int, int]:
    if not (0 <= team1_score <= 24 and 0 <= team2_score <= 24):
        raise ValueError("Mexicano scores must be between 0 and 24")
    if team1_score + team2_score != 24:
        raise ValueError("Mexicano scores must sum to 24")
    return team1_score, team2_score


def beat_the_box_delta(outcome: str) -> tuple[int, int]:
    if outcome == "Team1Win":
        return 25, -15
    if outcome == "Team2Win":
        return -15, 25
    if outcome == "Draw":
        return 5, 5
    raise ValueError("Outcome must be Team1Win, Team2Win, or Draw")


def result_type_for_event(event_type: EventType) -> str:
    if event_type == EventType.AMERICANO:
        return "WinLoss"
    if event_type == EventType.MEXICANO:
        return "Score24"
    return "WinLossDraw"

from dataclasses import dataclass
from datetime import date

from app.domain.enums import EventStatus, EventType, MatchStatus, ResultType, RoundStatus


@dataclass(slots=True)
class Player:
    id: str
    display_name: str
    global_ranking_score: int


@dataclass(slots=True)
class Event:
    id: str
    event_name: str
    event_type: EventType
    event_date: date
    status: EventStatus
    round_count: int
    round_duration_minutes: int
    current_round_number: int | None


@dataclass(slots=True)
class Round:
    id: str
    event_id: str
    round_number: int
    status: RoundStatus


@dataclass(slots=True)
class Match:
    id: str
    event_id: str
    round_id: str
    court_number: int
    team1_player1_id: str
    team1_player2_id: str
    team2_player1_id: str
    team2_player2_id: str
    result_type: ResultType
    winner_team: int | None
    is_draw: bool
    team1_score: int | None
    team2_score: int | None
    status: MatchStatus


@dataclass(slots=True)
class RoundPlanMatch:
    court_number: int
    team1: tuple[str, str]
    team2: tuple[str, str]
    result_type: ResultType


@dataclass(slots=True)
class RoundPlan:
    round_number: int
    matches: list[RoundPlanMatch]

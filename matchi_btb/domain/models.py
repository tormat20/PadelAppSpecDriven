from dataclasses import dataclass
from datetime import date

@dataclass
class Player:
    id: int
    name: str
    points: int

@dataclass
class Event:
    id: int
    name: str
    date: date

@dataclass
class Match:
    id: int
    box_id: int
    team1: list[Player]
    team2: list[Player]
    winning_team: int | None

@dataclass
class Box:
    id: int
    event_id: int
    players: list[Player]

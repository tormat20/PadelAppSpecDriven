from enum import Enum


class EventType(str, Enum):
    WINNERS_COURT = "WinnersCourt"
    MEXICANO = "Mexicano"
    BEAT_THE_BOX = "BeatTheBox"


class EventStatus(str, Enum):
    LOBBY = "Lobby"
    RUNNING = "Running"
    FINISHED = "Finished"


class SetupStatus(str, Enum):
    PLANNED = "planned"
    READY = "ready"


class RoundStatus(str, Enum):
    PENDING = "Pending"
    RUNNING = "Running"
    COMPLETED = "Completed"


class MatchStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"


class ResultType(str, Enum):
    WIN_LOSS = "WinLoss"
    SCORE_24 = "Score24"
    WIN_LOSS_DRAW = "WinLossDraw"

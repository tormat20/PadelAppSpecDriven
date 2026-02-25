from pydantic import BaseModel


class MatchView(BaseModel):
    matchId: str
    courtNumber: int
    team1: list[str]
    team2: list[str]
    status: str


class RoundView(BaseModel):
    eventId: str
    roundNumber: int
    matches: list[MatchView]


class RecordResultRequest(BaseModel):
    mode: str
    winningTeam: int | None = None
    team1Score: int | None = None
    team2Score: int | None = None
    outcome: str | None = None

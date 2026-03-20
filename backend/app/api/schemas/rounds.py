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


class PreviousRoundResponse(BaseModel):
    status: str
    warningMessage: str | None = None
    roundView: RoundView | None = None


class RecordResultRequest(BaseModel):
    mode: str
    winningTeam: int | None = None
    team1Score: int | None = None
    team2Score: int | None = None
    outcome: str | None = None


class CorrectResultRequest(RecordResultRequest):
    expectedUpdatedAt: str | None = None


class CorrectResultResponse(BaseModel):
    status: str
    matchId: str
    editedAt: str

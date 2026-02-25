from pydantic import BaseModel


class StandingItem(BaseModel):
    playerId: str
    displayName: str
    totalScore: int
    rank: int


class EventSummaryResponse(BaseModel):
    eventId: str
    finalStandings: list[StandingItem]
    rounds: list[dict]
    matches: list[dict]

from pydantic import BaseModel


class TeamPairRequest(BaseModel):
    player1Id: str
    player2Id: str


class SetTeamsRequest(BaseModel):
    teams: list[TeamPairRequest]


class TeamResponse(BaseModel):
    id: str
    eventId: str
    player1Id: str
    player2Id: str


class TeamsResponse(BaseModel):
    teams: list[TeamResponse]

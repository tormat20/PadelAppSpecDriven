from pydantic import BaseModel, Field


class CreatePlayerRequest(BaseModel):
    displayName: str = Field(min_length=2, max_length=60)


class PlayerResponse(BaseModel):
    id: str
    displayName: str
    globalRankingScore: int

from pydantic import BaseModel, Field


class CreatePlayerRequest(BaseModel):
    displayName: str = Field(min_length=2, max_length=60)
    email: str | None = None


class UpdatePlayerRequest(BaseModel):
    displayName: str = Field(min_length=2, max_length=60)
    email: str | None = None


class PlayerResponse(BaseModel):
    id: str
    displayName: str
    globalRankingScore: int
    email: str | None = None

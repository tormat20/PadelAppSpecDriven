from typing import Literal

from pydantic import BaseModel, Field


class StandingItem(BaseModel):
    playerId: str
    displayName: str
    totalScore: int
    rank: int


class FinalSummaryResponse(BaseModel):
    mode: Literal["final"] = "final"
    eventId: str
    orderingMode: str = "legacy"
    orderingVersion: str = "v1"
    finalStandings: list[StandingItem]
    crownedPlayerIds: list[str] = Field(default_factory=list)
    rounds: list[dict]
    matches: list[dict]
    columns: list["ProgressColumnItem"]
    playerRows: list["ProgressPlayerRow"]


class ProgressColumnItem(BaseModel):
    id: str
    label: str


class ProgressCellItem(BaseModel):
    columnId: str
    value: str


class ProgressPlayerRow(BaseModel):
    rank: int
    playerId: str
    displayName: str
    cells: list[ProgressCellItem]


class ProgressSummaryResponse(BaseModel):
    mode: Literal["progress"] = "progress"
    eventId: str
    orderingMode: str = "legacy"
    orderingVersion: str = "v1"
    columns: list[ProgressColumnItem]
    playerRows: list[ProgressPlayerRow]


EventSummaryResponse = FinalSummaryResponse | ProgressSummaryResponse

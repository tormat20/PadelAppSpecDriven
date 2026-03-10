from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from app.domain.enums import EventStatus, EventType, SetupStatus


class CreateEventRequest(BaseModel):
    eventName: str = Field(min_length=3, max_length=120)
    eventType: EventType
    eventDate: date
    eventTime24h: str = Field(default="00:00", min_length=5, max_length=5)
    createAction: Literal["create_event", "create_event_slot", "auto"] = Field(default="auto")
    selectedCourts: list[int] = Field(default_factory=list)
    playerIds: list[str] = Field(default_factory=list)
    isTeamMexicano: bool | None = None


class UpdateEventSetupRequest(BaseModel):
    expectedVersion: int = Field(ge=1)
    eventName: str | None = Field(default=None, min_length=3, max_length=120)
    eventType: EventType | None = None
    eventDate: date | None = None
    eventTime24h: str | None = Field(default=None, min_length=5, max_length=5)
    selectedCourts: list[int] | None = None
    playerIds: list[str] | None = None
    isTeamMexicano: bool | None = None


class PlanningWarningsResponse(BaseModel):
    pastDateTime: bool
    duplicateSlot: bool
    duplicateCount: int


class EventResponse(BaseModel):
    id: str
    eventName: str
    eventType: EventType
    eventDate: date
    eventTime24h: str | None
    status: EventStatus
    setupStatus: SetupStatus
    lifecycleStatus: Literal["planned", "ready", "ongoing", "finished"]
    missingRequirements: list[str]
    warnings: PlanningWarningsResponse
    version: int
    selectedCourts: list[int]
    playerIds: list[str]
    currentRoundNumber: int | None
    totalRounds: int
    roundDurationMinutes: int
    isTeamMexicano: bool


class SubstitutePlayerRequest(BaseModel):
    departingPlayerId: str
    substitutePlayerId: str


class SubstitutePlayerResponse(BaseModel):
    eventId: str
    departingPlayerId: str
    substitutePlayerId: str
    effectiveFromRound: int

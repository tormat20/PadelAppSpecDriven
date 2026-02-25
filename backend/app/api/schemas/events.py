from datetime import date

from pydantic import BaseModel, Field

from app.domain.enums import EventStatus, EventType


class CreateEventRequest(BaseModel):
    eventName: str = Field(min_length=3, max_length=120)
    eventType: EventType
    eventDate: date
    selectedCourts: list[int] = Field(min_length=1)
    playerIds: list[str] = Field(default_factory=list)


class EventResponse(BaseModel):
    id: str
    eventName: str
    eventType: EventType
    eventDate: date
    status: EventStatus
    selectedCourts: list[int]
    playerIds: list[str]
    currentRoundNumber: int | None

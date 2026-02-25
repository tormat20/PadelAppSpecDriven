from fastapi import APIRouter, HTTPException

from app.api.deps import services_scope
from app.api.schemas.events import CreateEventRequest, EventResponse
from app.api.schemas.summary import EventSummaryResponse, StandingItem

router = APIRouter(prefix="/events", tags=["events"])


def _to_event_response(event, player_ids: list[str], courts: list[int]) -> EventResponse:
    return EventResponse(
        id=event.id,
        eventName=event.event_name,
        eventType=event.event_type,
        eventDate=event.event_date,
        status=event.status,
        selectedCourts=courts,
        playerIds=player_ids,
        currentRoundNumber=event.current_round_number,
    )


@router.post("", response_model=EventResponse, status_code=201)
def create_event(payload: CreateEventRequest) -> EventResponse:
    with services_scope() as services:
        try:
            event = services["event_service"].create_event(
                payload.eventName,
                payload.eventType,
                payload.eventDate,
                payload.selectedCourts,
                payload.playerIds,
            )
            details = services["event_service"].get_event_details(event.id)
            return _to_event_response(details["event"], details["player_ids"], details["courts"])
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str) -> EventResponse:
    with services_scope() as services:
        try:
            details = services["event_service"].get_event_details(event_id)
            return _to_event_response(details["event"], details["player_ids"], details["courts"])
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{event_id}/start")
def start_event(event_id: str):
    with services_scope() as services:
        try:
            return services["event_service"].start_event(event_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{event_id}/next")
def next_event_round(event_id: str):
    with services_scope() as services:
        try:
            return services["round_service"].next_round(event_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{event_id}/finish", response_model=EventSummaryResponse)
def finish_event(event_id: str) -> EventSummaryResponse:
    with services_scope() as services:
        try:
            summary = services["summary_service"].finish_event(event_id)
            standings = [
                StandingItem(
                    playerId=row[1],
                    displayName=services["players_repo"].get(row[1]).display_name,
                    totalScore=row[2],
                    rank=row[3],
                )
                for row in summary["standings"]
            ]
            return EventSummaryResponse(
                eventId=event_id,
                finalStandings=standings,
                rounds=[{"roundNumber": r.round_number} for r in summary["rounds"]],
                matches=[
                    {"matchId": m.id, "courtNumber": m.court_number} for m in summary["matches"]
                ],
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

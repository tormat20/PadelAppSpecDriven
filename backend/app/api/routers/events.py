from fastapi import APIRouter, HTTPException

from app.api.deps import services_scope
from app.api.schemas.events import CreateEventRequest, EventResponse
from app.api.schemas.summary import (
    EventSummaryResponse,
    FinalSummaryResponse,
    ProgressSummaryResponse,
    StandingItem,
)

router = APIRouter(prefix="/events", tags=["events"])


def _extract_total_from_row(row: dict) -> int:
    for cell in row.get("cells", []):
        if cell.get("columnId") == "total":
            try:
                return int(cell.get("value", 0))
            except (TypeError, ValueError):
                return 0
    return 0


def _build_standings_from_rows(rows: list[dict]) -> list[StandingItem]:
    return [
        StandingItem(
            playerId=row["playerId"],
            displayName=row["displayName"],
            totalScore=_extract_total_from_row(row),
            rank=row["rank"],
        )
        for row in rows
    ]


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
        totalRounds=event.round_count,
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
def finish_event(event_id: str) -> FinalSummaryResponse:
    with services_scope() as services:
        try:
            summary = services["summary_service"].finish_event(event_id)
            matrix = services["summary_service"].build_final_round_matrix(event_id, summary)
            standings = _build_standings_from_rows(matrix["player_rows"])
            crowned_player_ids = services["summary_service"].crowned_player_ids(event_id, summary)
            return FinalSummaryResponse(
                eventId=event_id,
                orderingMode=matrix["ordering_mode"],
                orderingVersion=matrix["ordering_version"],
                finalStandings=standings,
                crownedPlayerIds=crowned_player_ids,
                rounds=[{"roundNumber": r.round_number} for r in summary["rounds"]],
                matches=[
                    {"matchId": m.id, "courtNumber": m.court_number} for m in summary["matches"]
                ],
                columns=matrix["columns"],
                playerRows=matrix["player_rows"],
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{event_id}/summary", response_model=EventSummaryResponse)
def get_event_summary(event_id: str) -> EventSummaryResponse:
    with services_scope() as services:
        try:
            if services["summary_service"].is_final_summary_available(event_id):
                summary = services["summary_service"].get_final_summary(event_id)
                matrix = services["summary_service"].build_final_round_matrix(event_id, summary)
                standings = _build_standings_from_rows(matrix["player_rows"])
                crowned_player_ids = services["summary_service"].crowned_player_ids(
                    event_id, summary
                )
                return FinalSummaryResponse(
                    eventId=event_id,
                    orderingMode=matrix["ordering_mode"],
                    orderingVersion=matrix["ordering_version"],
                    finalStandings=standings,
                    crownedPlayerIds=crowned_player_ids,
                    rounds=[{"roundNumber": r.round_number} for r in summary["rounds"]],
                    matches=[
                        {"matchId": m.id, "courtNumber": m.court_number} for m in summary["matches"]
                    ],
                    columns=matrix["columns"],
                    playerRows=matrix["player_rows"],
                )

            progress = services["summary_service"].get_progress_summary(event_id)
            return ProgressSummaryResponse(
                eventId=event_id,
                orderingMode=progress["ordering_mode"],
                orderingVersion=progress["ordering_version"],
                columns=progress["columns"],
                playerRows=progress["player_rows"],
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

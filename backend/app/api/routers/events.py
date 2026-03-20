from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import TokenData, require_admin, services_scope
from app.core.errors import DomainError
from app.api.schemas.events import (
    CreateEventRequest,
    EventResponse,
    PlanningWarningsResponse,
    SubstitutePlayerRequest,
    UpdateEventSetupRequest,
)
from app.api.schemas.teams import SetTeamsRequest, TeamResponse, TeamsResponse
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


def _to_event_response(
    event,
    player_ids: list[str],
    courts: list[int],
    missing_requirements: list[str],
    warnings: dict,
    lifecycle_status: Literal["planned", "ready", "ongoing", "finished"],
) -> EventResponse:
    return EventResponse(
        id=event.id,
        eventName=event.event_name,
        eventType=event.event_type,
        eventDate=event.event_date,
        eventTime24h=event.event_time,
        status=event.status,
        setupStatus=event.setup_status,
        lifecycleStatus=lifecycle_status,
        missingRequirements=missing_requirements,
        warnings=PlanningWarningsResponse(**warnings),
        version=event.version,
        selectedCourts=courts,
        playerIds=player_ids,
        currentRoundNumber=event.current_round_number,
        totalRounds=event.round_count,
        roundDurationMinutes=event.round_duration_minutes,
        eventDurationMinutes=event.event_duration_minutes,
        isTeamMexicano=event.is_team_mexicano,
    )


@router.get("", response_model=list[EventResponse])
def list_events(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> list[EventResponse]:
    with services_scope() as services:
        if from_date is not None and to_date is not None:
            events = services["event_service"].list_events_by_date_range(from_date, to_date)
        else:
            events = services["event_service"].list_events()
        return [
            _to_event_response(
                row["event"],
                row["player_ids"],
                row["courts"],
                row["missing_requirements"],
                row["warnings"],
                row["lifecycle_status"],
            )
            for row in events
        ]


@router.post("", response_model=EventResponse, status_code=201)
def create_event(
    payload: CreateEventRequest, _: TokenData = Depends(require_admin)
) -> EventResponse:
    with services_scope() as services:
        try:
            event = services["event_service"].create_event(
                payload.eventName,
                payload.eventType,
                payload.eventDate,
                payload.eventTime24h,
                payload.eventDurationMinutes,
                payload.createAction,
                payload.selectedCourts,
                payload.playerIds,
                payload.isTeamMexicano or False,
            )
            details = services["event_service"].get_event_details(event.id)
            return _to_event_response(
                details["event"],
                details["player_ids"],
                details["courts"],
                details["missing_requirements"],
                details["warnings"],
                details["lifecycle_status"],
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: str) -> EventResponse:
    with services_scope() as services:
        try:
            details = services["event_service"].get_event_details(event_id)
            return _to_event_response(
                details["event"],
                details["player_ids"],
                details["courts"],
                details["missing_requirements"],
                details["warnings"],
                details["lifecycle_status"],
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: str, payload: UpdateEventSetupRequest, _: TokenData = Depends(require_admin)
) -> EventResponse:
    with services_scope() as services:
        try:
            details = services["event_service"].update_event_setup(
                event_id=event_id,
                expected_version=payload.expectedVersion,
                event_name=payload.eventName,
                event_type=payload.eventType,
                event_date=payload.eventDate,
                event_time24h=payload.eventTime24h,
                event_duration_minutes=payload.eventDurationMinutes,
                selected_courts=payload.selectedCourts,
                player_ids=payload.playerIds,
                is_team_mexicano=payload.isTeamMexicano,
            )
            return _to_event_response(
                details["event"],
                details["player_ids"],
                details["courts"],
                details["missing_requirements"],
                details["warnings"],
                details["lifecycle_status"],
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            detail = str(exc)
            if detail.startswith("conflict:"):
                version = detail.split(":", 1)[1]
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "EVENT_VERSION_CONFLICT",
                        "currentVersion": int(version),
                        "message": "Event changed by another organizer. Refresh and retry.",
                    },
                ) from exc
            raise HTTPException(status_code=400, detail=detail) from exc


@router.post("/{event_id}/start")
def start_event(event_id: str, _: TokenData = Depends(require_admin)):
    with services_scope() as services:
        try:
            return services["event_service"].start_event(event_id)
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{event_id}/restart", response_model=EventResponse)
def restart_event(event_id: str, _: TokenData = Depends(require_admin)) -> EventResponse:
    with services_scope() as services:
        try:
            details = services["event_service"].restart_event(event_id)
            return _to_event_response(
                details["event"],
                details["player_ids"],
                details["courts"],
                details["missing_requirements"],
                details["warnings"],
                details["lifecycle_status"],
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: str, _: TokenData = Depends(require_admin)) -> None:
    with services_scope() as services:
        try:
            services["event_service"].delete_event(event_id)
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{event_id}/next")
def next_event_round(event_id: str, _: TokenData = Depends(require_admin)):
    with services_scope() as services:
        try:
            return services["round_service"].next_round(event_id)
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{event_id}/finish", response_model=EventSummaryResponse)
def finish_event(event_id: str, _: TokenData = Depends(require_admin)) -> FinalSummaryResponse:
    with services_scope() as services:
        try:
            summary = services["summary_service"].finish_event(event_id)
            matrix = services["summary_service"].build_final_round_matrix(event_id, summary)
            standings = _build_standings_from_rows(matrix["player_rows"])
            crowned_player_ids = services["summary_service"].crowned_player_ids(event_id, summary)
            event = services["event_service"].get_event_details(event_id)["event"]
            return FinalSummaryResponse(
                eventId=event_id,
                eventName=event.event_name,
                eventType=event.event_type.value,
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
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
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
                event = services["event_service"].get_event_details(event_id)["event"]
                return FinalSummaryResponse(
                    eventId=event_id,
                    eventName=event.event_name,
                    eventType=event.event_type.value,
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
            event = services["event_service"].get_event_details(event_id)["event"]
            return ProgressSummaryResponse(
                eventId=event_id,
                eventName=event.event_name,
                orderingMode=progress["ordering_mode"],
                orderingVersion=progress["ordering_version"],
                columns=progress["columns"],
                playerRows=progress["player_rows"],
                scoreRows=progress.get("score_rows", []),
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{event_id}/teams", response_model=TeamsResponse)
def get_event_teams(event_id: str) -> TeamsResponse:
    with services_scope() as services:
        try:
            teams = services["event_service"].get_event_teams(event_id)
            return TeamsResponse(
                teams=[
                    TeamResponse(
                        id=t.id,
                        eventId=t.event_id,
                        player1Id=t.player1_id,
                        player2Id=t.player2_id,
                    )
                    for t in teams
                ]
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc


@router.post("/{event_id}/teams", response_model=TeamsResponse)
def set_event_teams(
    event_id: str, payload: SetTeamsRequest, _: TokenData = Depends(require_admin)
) -> TeamsResponse:
    with services_scope() as services:
        try:
            teams = services["event_service"].set_event_teams(
                event_id,
                [(pair.player1Id, pair.player2Id) for pair in payload.teams],
            )
            return TeamsResponse(
                teams=[
                    TeamResponse(
                        id=t.id,
                        eventId=t.event_id,
                        player1Id=t.player1_id,
                        player2Id=t.player2_id,
                    )
                    for t in teams
                ]
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc


@router.post("/{event_id}/substitute")
def substitute_player(
    event_id: str, payload: SubstitutePlayerRequest, _: TokenData = Depends(require_admin)
):
    with services_scope() as services:
        try:
            return services["event_service"].substitute_player(
                event_id,
                payload.departingPlayerId,
                payload.substitutePlayerId,
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

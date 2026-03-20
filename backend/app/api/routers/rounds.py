from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import TokenData, require_admin, services_scope
from app.api.schemas.rounds import (
    CorrectResultRequest,
    CorrectResultResponse,
    MatchView,
    PreviousRoundResponse,
    RecordResultRequest,
    RoundView,
)
from app.core.errors import DomainError

router = APIRouter(tags=["rounds"])


def _to_round_view(view: dict) -> RoundView:
    return RoundView(
        eventId=view["event_id"],
        roundNumber=view["round_number"],
        matches=[
            MatchView(
                matchId=m.id,
                courtNumber=m.court_number,
                team1=[m.team1_player1_id, m.team1_player2_id],
                team2=[m.team2_player1_id, m.team2_player2_id],
                status=m.status.value,
            )
            for m in view["matches"]
        ],
    )


@router.get("/events/{event_id}/rounds/current", response_model=RoundView)
def current_round(event_id: str, _: TokenData = Depends(require_admin)) -> RoundView:
    with services_scope() as services:
        try:
            view = services["round_service"].get_current_round_view(event_id)
            return _to_round_view(view)
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/events/{event_id}/previous", response_model=PreviousRoundResponse)
def previous_round(
    event_id: str,
    _: TokenData = Depends(require_admin),
) -> PreviousRoundResponse:
    with services_scope() as services:
        try:
            result = services["round_service"].go_previous_round(event_id)
            round_view = _to_round_view(result["roundView"]) if result["roundView"] else None
            return PreviousRoundResponse(
                status=result["status"],
                warningMessage=result["warningMessage"],
                roundView=round_view,
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/matches/{match_id}/result", status_code=204)
def submit_result(
    match_id: str, payload: RecordResultRequest, _: TokenData = Depends(require_admin)
) -> None:
    with services_scope() as services:
        try:
            services["round_service"].record_result(match_id, payload.mode, payload.model_dump())
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/matches/{match_id}/result", response_model=CorrectResultResponse)
def correct_result(
    match_id: str,
    payload: CorrectResultRequest,
    token: TokenData = Depends(require_admin),
) -> CorrectResultResponse:
    with services_scope() as services:
        try:
            return services["round_service"].correct_result(
                match_id,
                payload.mode,
                payload.model_dump(),
                edited_by_user_id=token.sub,
                expected_updated_at=payload.expectedUpdatedAt,
            )
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

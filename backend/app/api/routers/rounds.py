from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import TokenData, require_admin, services_scope
from app.api.schemas.rounds import MatchView, RecordResultRequest, RoundView
from app.core.errors import DomainError

router = APIRouter(tags=["rounds"])


@router.get("/events/{event_id}/rounds/current", response_model=RoundView)
def current_round(event_id: str, _: TokenData = Depends(require_admin)) -> RoundView:
    with services_scope() as services:
        try:
            view = services["round_service"].get_current_round_view(event_id)
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
        except DomainError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.to_detail()) from exc
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc


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

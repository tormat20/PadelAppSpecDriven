from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import TokenData, require_admin, services_scope, read_services_scope
from app.api.schemas.players import CreatePlayerRequest, PlayerResponse, UpdatePlayerRequest
from app.api.schemas.stats import OnFireResponse, PlayerDeepDiveResponse, PlayerStatsResponse
from app.services.name_format import format_display_name

router = APIRouter(prefix="/players", tags=["players"])


def _player_response(p) -> PlayerResponse:
    return PlayerResponse(
        id=p.id,
        displayName=format_display_name(p.display_name),
        globalRankingScore=p.global_ranking_score,
        email=p.email,
    )


@router.get("", response_model=list[PlayerResponse])
def list_players(query: str | None = Query(default=None)) -> list[PlayerResponse]:
    with services_scope() as services:
        players = services["player_service"].search_players(query)
        return [_player_response(p) for p in players]


@router.post("", response_model=PlayerResponse, status_code=201)
def create_player(
    payload: CreatePlayerRequest, _: TokenData = Depends(require_admin)
) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].create_player(payload.displayName, payload.email)
        return _player_response(player)


@router.get("/on-fire", response_model=OnFireResponse)
def get_on_fire_players() -> OnFireResponse:
    with read_services_scope() as services:
        player_ids = services["player_stats_service"].get_on_fire_player_ids()
    return OnFireResponse(player_ids=player_ids)


@router.get("/{player_id}/stats", response_model=PlayerStatsResponse)
def get_player_stats(player_id: str) -> PlayerStatsResponse:
    with services_scope() as services:
        player = services["player_service"].get_player(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        stats = services["player_stats_service"].get_player_stats(player_id)
        return PlayerStatsResponse(
            player_id=player_id,
            display_name=format_display_name(player.display_name),
            mexicano_score_total=stats["mexicano_score_total"],
            americano_score_total=stats["americano_score_total"],
            team_mexicano_score_total=stats["team_mexicano_score_total"],
            rb_score_total=stats["rb_score_total"],
            events_attended=stats["events_attended"],
            wc_matches_played=stats["wc_matches_played"],
            wc_wins=stats["wc_wins"],
            wc_losses=stats["wc_losses"],
            rb_wins=stats["rb_wins"],
            rb_losses=stats["rb_losses"],
            rb_draws=stats["rb_draws"],
            event_wins=stats["event_wins"],
            mexicano_best_event_score=stats["mexicano_best_event_score"],
            mexicano_events_played=stats["mexicano_events_played"],
            team_mexicano_events_played=stats["team_mexicano_events_played"],
        )


@router.get("/{player_id}/stats/deep-dive", response_model=PlayerDeepDiveResponse)
def get_player_deep_dive(player_id: str) -> PlayerDeepDiveResponse:
    with services_scope() as services:
        player = services["player_service"].get_player(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        data = services["player_stats_service"].get_player_deep_dive(player_id)
    return PlayerDeepDiveResponse(**data)


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: str) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].get_player(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return _player_response(player)


@router.patch("/{player_id}", response_model=PlayerResponse)
def update_player(
    player_id: str,
    payload: UpdatePlayerRequest,
    _: TokenData = Depends(require_admin),
) -> PlayerResponse:
    with services_scope() as services:
        try:
            player = services["player_service"].update_player(
                player_id,
                payload.displayName,
                payload.email,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return _player_response(player)


@router.delete("/{player_id}", status_code=200)
def delete_player(
    player_id: str,
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        found = services["player_service"].delete_player(player_id)
    if not found:
        raise HTTPException(status_code=404, detail="Player not found.")
    return {"status": "ok"}

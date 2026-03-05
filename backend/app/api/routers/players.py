from fastapi import APIRouter, HTTPException, Query

from app.api.deps import services_scope
from app.api.schemas.players import CreatePlayerRequest, PlayerResponse
from app.api.schemas.stats import PlayerStatsResponse
from app.services.name_format import format_display_name

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerResponse])
def list_players(query: str | None = Query(default=None)) -> list[PlayerResponse]:
    with services_scope() as services:
        players = services["player_service"].search_players(query)
        return [
            PlayerResponse(
                id=p.id,
                displayName=format_display_name(p.display_name),
                globalRankingScore=p.global_ranking_score,
            )
            for p in players
        ]


@router.post("", response_model=PlayerResponse, status_code=201)
def create_player(payload: CreatePlayerRequest) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].create_player(payload.displayName)
        return PlayerResponse(
            id=player.id,
            displayName=format_display_name(player.display_name),
            globalRankingScore=player.global_ranking_score,
        )


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
            rb_score_total=stats["rb_score_total"],
            events_attended=stats["events_attended"],
            wc_matches_played=stats["wc_matches_played"],
            wc_wins=stats["wc_wins"],
            wc_losses=stats["wc_losses"],
            rb_wins=stats["rb_wins"],
            rb_losses=stats["rb_losses"],
            rb_draws=stats["rb_draws"],
        )


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: str) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].get_player(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return PlayerResponse(
            id=player.id,
            displayName=format_display_name(player.display_name),
            globalRankingScore=player.global_ranking_score,
        )

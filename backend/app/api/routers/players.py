from fastapi import APIRouter, HTTPException, Query

from app.api.deps import services_scope
from app.api.schemas.players import CreatePlayerRequest, PlayerResponse

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[PlayerResponse])
def list_players(query: str | None = Query(default=None)) -> list[PlayerResponse]:
    with services_scope() as services:
        players = services["player_service"].search_players(query)
        return [
            PlayerResponse(
                id=p.id, displayName=p.display_name, globalRankingScore=p.global_ranking_score
            )
            for p in players
        ]


@router.post("", response_model=PlayerResponse, status_code=201)
def create_player(payload: CreatePlayerRequest) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].create_player(payload.displayName)
        return PlayerResponse(
            id=player.id,
            displayName=player.display_name,
            globalRankingScore=player.global_ranking_score,
        )


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: str) -> PlayerResponse:
    with services_scope() as services:
        player = services["player_service"].get_player(player_id)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return PlayerResponse(
            id=player.id,
            displayName=player.display_name,
            globalRankingScore=player.global_ranking_score,
        )

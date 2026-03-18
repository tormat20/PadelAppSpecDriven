from fastapi import APIRouter, Depends

from app.api.deps import TokenData, require_admin, services_scope

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/players/reset-stats", status_code=200)
def reset_all_player_stats(
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        services["player_service"].reset_all_player_stats()
    return {"status": "ok"}


@router.delete("/players", status_code=200)
def delete_all_players(
    _: TokenData = Depends(require_admin),
) -> dict:
    with services_scope() as services:
        services["player_service"].delete_all_players()
    return {"status": "ok"}

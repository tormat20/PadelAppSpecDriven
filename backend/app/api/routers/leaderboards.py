from datetime import datetime, timezone

from fastapi import APIRouter

from app.api.deps import read_services_scope
from app.api.schemas.stats import (
    LeaderboardEntryResponse,
    LeaderboardResponse,
    RankedBoxLadderEntryResponse,
    RankedBoxLadderResponse,
)

router = APIRouter(prefix="/leaderboards", tags=["leaderboards"])


@router.get("/player-of-month", response_model=LeaderboardResponse)
def get_player_of_month() -> LeaderboardResponse:
    now_utc = datetime.now(timezone.utc)
    year, month = now_utc.year, now_utc.month
    with read_services_scope() as services:
        rows = services["player_stats_service"].get_player_of_month_leaderboard(year, month)
    return LeaderboardResponse(
        year=year,
        month=month,
        entries=[
            LeaderboardEntryResponse(
                rank=row["rank"],
                player_id=row["player_id"],
                display_name=row["display_name"],
                events_played=row["events_played"],
                mexicano_score=row["mexicano_score"],
                rb_score=row["rb_score"],
            )
            for row in rows
        ],
    )


@router.get("/mexicano-of-month", response_model=LeaderboardResponse)
def get_mexicano_of_month() -> LeaderboardResponse:
    now_utc = datetime.now(timezone.utc)
    year, month = now_utc.year, now_utc.month
    with read_services_scope() as services:
        rows = services["player_stats_service"].get_mexicano_of_month_leaderboard(year, month)
    return LeaderboardResponse(
        year=year,
        month=month,
        entries=[
            LeaderboardEntryResponse(
                rank=row["rank"],
                player_id=row["player_id"],
                display_name=row["display_name"],
                events_played=row["events_played"],
                mexicano_score=row["mexicano_score"],
                rb_score=row["rb_score"],
            )
            for row in rows
        ],
    )


@router.get("/ranked-box-ladder", response_model=RankedBoxLadderResponse)
def get_ranked_box_ladder() -> RankedBoxLadderResponse:
    with read_services_scope() as services:
        rows = services["player_stats_service"].get_ranked_box_ladder()
    return RankedBoxLadderResponse(
        entries=[
            RankedBoxLadderEntryResponse(
                rank=row["rank"],
                player_id=row["player_id"],
                display_name=row["display_name"],
                rb_score_total=row["rb_score_total"],
                rb_wins=row["rb_wins"],
                rb_losses=row["rb_losses"],
                rb_draws=row["rb_draws"],
            )
            for row in rows
        ]
    )

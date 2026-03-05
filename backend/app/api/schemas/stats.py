from pydantic import BaseModel


class PlayerStatsResponse(BaseModel):
    player_id: str
    display_name: str
    mexicano_score_total: int
    btb_score_total: int
    events_attended: int
    wc_matches_played: int
    wc_wins: int
    wc_losses: int
    btb_wins: int
    btb_losses: int
    btb_draws: int


class LeaderboardEntryResponse(BaseModel):
    rank: int
    player_id: str
    display_name: str
    events_played: int
    mexicano_score: int
    btb_score: int


class LeaderboardResponse(BaseModel):
    year: int
    month: int
    entries: list[LeaderboardEntryResponse]

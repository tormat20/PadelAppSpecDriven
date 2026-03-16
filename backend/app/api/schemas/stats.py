from pydantic import BaseModel


class PlayerStatsResponse(BaseModel):
    player_id: str
    display_name: str
    mexicano_score_total: int
    rb_score_total: int
    events_attended: int
    wc_matches_played: int
    wc_wins: int
    wc_losses: int
    rb_wins: int
    rb_losses: int
    rb_draws: int
    event_wins: int
    mexicano_best_event_score: int


class LeaderboardEntryResponse(BaseModel):
    rank: int
    player_id: str
    display_name: str
    events_played: int
    mexicano_score: int
    rb_score: int


class LeaderboardResponse(BaseModel):
    year: int
    month: int
    entries: list[LeaderboardEntryResponse]


class RankedBoxLadderEntryResponse(BaseModel):
    rank: int
    player_id: str
    display_name: str
    rb_score_total: int
    rb_wins: int
    rb_losses: int
    rb_draws: int


class RankedBoxLadderResponse(BaseModel):
    entries: list[RankedBoxLadderEntryResponse]


class MexicanoHighscoreEntryResponse(BaseModel):
    rank: int
    player_id: str
    display_name: str
    mexicano_best_event_score: int


class MexicanoHighscoreResponse(BaseModel):
    entries: list[MexicanoHighscoreEntryResponse]


class OnFireResponse(BaseModel):
    player_ids: list[str]

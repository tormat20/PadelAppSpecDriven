from pydantic import BaseModel


# ── Deep-dive sub-models ───────────────────────────────────────────────────────


class RoundAvgScore(BaseModel):
    round: int
    avg_score: float
    sample_count: int


class RoundAvgCourtScore(BaseModel):
    round: int
    avg_court_score: float
    sample_count: int


class ScoreDistEntry(BaseModel):
    score: int
    count: int


class ScoreDistPerCourt(BaseModel):
    court_number: int
    distribution: list[ScoreDistEntry]


class MatchWDL(BaseModel):
    wins: int
    draws: int
    losses: int


class Score24ModeStats(BaseModel):
    avg_score_per_round: list[RoundAvgScore]
    avg_score_per_round_last_month: list[RoundAvgScore]
    avg_score_per_round_last_week: list[RoundAvgScore]
    avg_court_score_per_round: list[RoundAvgCourtScore]
    avg_court_score_per_round_last_month: list[RoundAvgCourtScore]
    avg_court_score_per_round_last_week: list[RoundAvgCourtScore]
    avg_court_score_overall: float | None
    match_wdl: MatchWDL
    score_distribution: list[ScoreDistEntry]
    score_distribution_per_court: list[ScoreDistPerCourt]


class RoundWDL(BaseModel):
    round: int
    wins: int
    draws: int
    losses: int


class EloPoint(BaseModel):
    event_date: str
    cumulative_score: int


class RankedBoxStats(BaseModel):
    per_round_wdl: list[RoundWDL]
    elo_timeline: list[EloPoint]


class WinnersCourtStats(BaseModel):
    per_round_wdl: list[RoundWDL]


class PlayerDeepDiveResponse(BaseModel):
    mexicano: Score24ModeStats
    americano: Score24ModeStats
    team_mexicano: Score24ModeStats
    ranked_box: RankedBoxStats
    winners_court: WinnersCourtStats


# ── Existing schemas ───────────────────────────────────────────────────────────


class PlayerStatsResponse(BaseModel):
    player_id: str
    display_name: str
    mexicano_score_total: int
    americano_score_total: int
    team_mexicano_score_total: int
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
    mexicano_events_played: int
    team_mexicano_events_played: int


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

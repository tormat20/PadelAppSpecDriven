from datetime import datetime, timezone

from app.domain.enums import EventType, MatchStatus, ResultType
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.player_stats_repo import PlayerStatsRepository
from app.repositories.players_repo import PlayersRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.name_format import format_display_name


class PlayerStatsService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
        players_repo: PlayersRepository,
        player_stats_repo: PlayerStatsRepository,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.players_repo = players_repo
        self.player_stats_repo = player_stats_repo

    # ── Write path ────────────────────────────────────────────────────────────

    def apply_event_stats(self, event_id: str) -> None:
        """
        Idempotently write player stats for a finished event.
        Reads all matches in the event, accumulates per-player deltas,
        then upserts into player_stats and monthly_player_stats.
        No-ops if event_id is already in player_stats_event_log.
        """
        if self.player_stats_repo.is_event_applied(event_id):
            return

        event = self.events_repo.get(event_id)
        if not event:
            return

        # UTC calendar month for monthly stats
        now_utc = datetime.now(timezone.utc)
        year = now_utc.year
        month = now_utc.month

        # Collect all player IDs for this event
        player_ids = self.events_repo.list_player_ids(event_id)

        # Per-player delta accumulators
        all_time_deltas: dict[str, dict] = {pid: _zero_all_time_deltas() for pid in player_ids}
        monthly_deltas: dict[str, dict] = {pid: _zero_monthly_deltas() for pid in player_ids}

        # Accumulate stats from every completed match
        rounds = self.rounds_repo.list_rounds(event_id)
        for round_obj in rounds:
            for match in self.matches_repo.list_by_round(round_obj.id):
                if match.status != MatchStatus.COMPLETED:
                    continue
                self._accumulate_match(match, event.event_type, all_time_deltas, monthly_deltas)

        # Each player attended this event (add 1 to events_attended)
        for pid in player_ids:
            all_time_deltas[pid]["events_attended_delta"] += 1
            monthly_deltas[pid]["events_played_delta"] += 1

        # Write deltas
        for pid in player_ids:
            self.player_stats_repo.upsert_player_stats(pid, all_time_deltas[pid])
            self.player_stats_repo.upsert_monthly_player_stats(
                pid, year, month, monthly_deltas[pid]
            )

        # Mark idempotency guard
        self.player_stats_repo.mark_event_applied(event_id)

    # ── Read path ─────────────────────────────────────────────────────────────

    def get_player_stats(self, player_id: str) -> dict:
        """
        Returns all-time stats dict for one player.
        Returns zero-filled dict if no stats row exists yet.
        """
        row = self.player_stats_repo.get_player_stats(player_id)
        if row is None:
            return _zero_all_time_stats(player_id)
        return row

    def get_player_of_month_leaderboard(self, year: int, month: int) -> list[dict]:
        """Returns player-of-month leaderboard for given year/month with rank assigned."""
        rows = self.player_stats_repo.get_player_of_month(year, month)
        return _assign_ranks(rows, key=("events_played", "mexicano_score", "btb_score"))

    def get_mexicano_of_month_leaderboard(self, year: int, month: int) -> list[dict]:
        """Returns Mexicano-of-month leaderboard for given year/month with rank assigned."""
        rows = self.player_stats_repo.get_mexicano_of_month(year, month)
        return _assign_ranks(rows, key=("mexicano_score",))

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _accumulate_match(
        self,
        match,
        event_type: EventType,
        all_time_deltas: dict[str, dict],
        monthly_deltas: dict[str, dict],
    ) -> None:
        """Accumulate per-match stats into the per-player delta dicts."""
        players_on_team1 = {match.team1_player1_id, match.team1_player2_id} - {None}
        players_on_team2 = {match.team2_player1_id, match.team2_player2_id} - {None}
        all_players = players_on_team1 | players_on_team2

        for pid in all_players:
            if pid not in all_time_deltas:
                continue
            player_team = 1 if pid in players_on_team1 else 2

            if match.result_type == ResultType.SCORE_24:
                # Mexicano: accumulate score
                score = (
                    int(match.team1_score or 0) if player_team == 1 else int(match.team2_score or 0)
                )
                all_time_deltas[pid]["mexicano_score_delta"] += score
                monthly_deltas[pid]["mexicano_score_delta"] += score

            elif match.result_type == ResultType.WIN_LOSS:
                # WinnersCourt: win/loss per match
                all_time_deltas[pid]["wc_matches_played_delta"] += 1
                if match.winner_team == player_team:
                    all_time_deltas[pid]["wc_wins_delta"] += 1
                else:
                    all_time_deltas[pid]["wc_losses_delta"] += 1

            elif match.result_type == ResultType.WIN_LOSS_DRAW:
                # BeatTheBox: win/loss/draw + numeric score
                if match.is_draw:
                    numeric = 5
                    all_time_deltas[pid]["btb_draws_delta"] += 1
                elif match.winner_team == player_team:
                    numeric = 25
                    all_time_deltas[pid]["btb_wins_delta"] += 1
                else:
                    numeric = -15
                    all_time_deltas[pid]["btb_losses_delta"] += 1
                all_time_deltas[pid]["btb_score_delta"] += numeric
                monthly_deltas[pid]["btb_score_delta"] += numeric


# ── Module-level helpers ───────────────────────────────────────────────────────


def _zero_all_time_deltas() -> dict:
    return {
        "mexicano_score_delta": 0,
        "btb_score_delta": 0,
        "events_attended_delta": 0,
        "wc_matches_played_delta": 0,
        "wc_wins_delta": 0,
        "wc_losses_delta": 0,
        "btb_wins_delta": 0,
        "btb_losses_delta": 0,
        "btb_draws_delta": 0,
    }


def _zero_monthly_deltas() -> dict:
    return {
        "events_played_delta": 0,
        "mexicano_score_delta": 0,
        "btb_score_delta": 0,
    }


def _zero_all_time_stats(player_id: str) -> dict:
    return {
        "player_id": player_id,
        "mexicano_score_total": 0,
        "btb_score_total": 0,
        "events_attended": 0,
        "wc_matches_played": 0,
        "wc_wins": 0,
        "wc_losses": 0,
        "btb_wins": 0,
        "btb_losses": 0,
        "btb_draws": 0,
    }


def _assign_ranks(rows: list[dict], key: tuple) -> list[dict]:
    """
    Assign dense rank positions to a pre-sorted list of rows.
    Rows with identical values for all key fields share the same rank.
    The sort order is already enforced by SQL; we only assign rank numbers here.
    """
    result = []
    rank = 0
    prev_key_values: tuple | None = None
    for i, row in enumerate(rows):
        current_key = tuple(row.get(k, 0) for k in key)
        if current_key != prev_key_values:
            rank = i + 1
            prev_key_values = current_key
        result.append({**row, "rank": rank})
    return result

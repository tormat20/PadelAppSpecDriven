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

        # Collect all completed matches for crown derivation
        all_completed_matches: list = []

        # Accumulate stats from every completed match
        rounds = self.rounds_repo.list_rounds(event_id)
        for round_obj in rounds:
            for match in self.matches_repo.list_by_round(round_obj.id):
                if match.status != MatchStatus.COMPLETED:
                    continue
                all_completed_matches.append(match)
                self._accumulate_match(match, event.event_type, all_time_deltas, monthly_deltas)

        # Each player attended this event (add 1 to events_attended)
        for pid in player_ids:
            all_time_deltas[pid]["events_attended_delta"] += 1
            monthly_deltas[pid]["events_played_delta"] += 1

        # Derive crowned (winning) players for this event
        crowned_ids = self._derive_crowned_player_ids(
            event.event_type, all_time_deltas, all_completed_matches, rounds
        )
        for pid in crowned_ids:
            if pid in all_time_deltas:
                all_time_deltas[pid]["event_wins_delta"] += 1

        # For Mexicano/Americano: record each player's total event score as candidate highscore
        if event.event_type in (EventType.MEXICANO, EventType.AMERICANO):
            for pid in player_ids:
                score = all_time_deltas[pid]["mexicano_score_delta"]
                all_time_deltas[pid]["mexicano_event_score"] = score

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
        return _assign_ranks(rows, key=("events_played", "mexicano_score", "rb_score"))

    def get_mexicano_of_month_leaderboard(self, year: int, month: int) -> list[dict]:
        """Returns Mexicano-of-month leaderboard for given year/month with rank assigned."""
        rows = self.player_stats_repo.get_mexicano_of_month(year, month)
        return _assign_ranks(rows, key=("mexicano_score",))

    def get_ranked_box_ladder(self) -> list[dict]:
        """Returns all-time Ranked Box ladder ordered by rb_score_total DESC, with rank."""
        rows = self.player_stats_repo.get_ranked_box_ladder()
        return _assign_ranks(rows, key=("rb_score_total",))

    def get_mexicano_highscore_leaderboard(self) -> list[dict]:
        """Returns all-time Mexicano highscore ladder (best single-event score) with rank."""
        rows = self.player_stats_repo.get_mexicano_highscore_ladder()
        return _assign_ranks(rows, key=("mexicano_best_event_score",))

    def get_on_fire_player_ids(self) -> list[str]:
        """Returns player IDs whose last event win was within the past 7 days."""
        return self.player_stats_repo.get_on_fire_player_ids()

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _derive_crowned_player_ids(
        self,
        event_type: EventType,
        all_time_deltas: dict[str, dict],
        all_completed_matches: list,
        rounds: list,
    ) -> list[str]:
        """
        Derive which player IDs 'won' this event, mirroring the crown logic in SummaryService.
        - Mexicano / Americano: player(s) with the highest cumulative mexicano score delta.
        - WinnersCourt: winners of the highest-court match in the final round.
        - RankedBox: no crowns.
        """
        if event_type in (EventType.MEXICANO, EventType.AMERICANO):
            if not all_time_deltas:
                return []
            scores = {pid: d["mexicano_score_delta"] for pid, d in all_time_deltas.items()}
            top_score = max(scores.values(), default=0)
            if top_score <= 0:
                return []
            return [pid for pid, s in scores.items() if s == top_score]

        if event_type == EventType.WINNERS_COURT:
            if not rounds:
                return []
            final_round_number = max(r.round_number for r in rounds)
            final_round_ids = {r.id for r in rounds if r.round_number == final_round_number}
            final_matches = [m for m in all_completed_matches if m.round_id in final_round_ids]
            if not final_matches:
                return []
            highest = max(final_matches, key=lambda m: m.court_number)
            if highest.winner_team == 1:
                return [p for p in [highest.team1_player1_id, highest.team1_player2_id] if p]
            if highest.winner_team == 2:
                return [p for p in [highest.team2_player1_id, highest.team2_player2_id] if p]
            return []

        return []

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
                # RankedBox: win/loss/draw + numeric score
                if match.is_draw:
                    numeric = 5
                    all_time_deltas[pid]["rb_draws_delta"] += 1
                elif match.winner_team == player_team:
                    numeric = 25
                    all_time_deltas[pid]["rb_wins_delta"] += 1
                else:
                    numeric = -15
                    all_time_deltas[pid]["rb_losses_delta"] += 1
                all_time_deltas[pid]["rb_score_delta"] += numeric
                monthly_deltas[pid]["rb_score_delta"] += numeric


# ── Module-level helpers ───────────────────────────────────────────────────────


def _zero_all_time_deltas() -> dict:
    return {
        "mexicano_score_delta": 0,
        "rb_score_delta": 0,
        "events_attended_delta": 0,
        "wc_matches_played_delta": 0,
        "wc_wins_delta": 0,
        "wc_losses_delta": 0,
        "rb_wins_delta": 0,
        "rb_losses_delta": 0,
        "rb_draws_delta": 0,
        "event_wins_delta": 0,
        "mexicano_event_score": 0,
    }


def _zero_monthly_deltas() -> dict:
    return {
        "events_played_delta": 0,
        "mexicano_score_delta": 0,
        "rb_score_delta": 0,
    }


def _zero_all_time_stats(player_id: str) -> dict:
    return {
        "player_id": player_id,
        "mexicano_score_total": 0,
        "rb_score_total": 0,
        "events_attended": 0,
        "wc_matches_played": 0,
        "wc_wins": 0,
        "wc_losses": 0,
        "rb_wins": 0,
        "rb_losses": 0,
        "rb_draws": 0,
        "mexicano_best_event_score": 0,
        "event_wins": 0,
        "last_win_at": None,
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

from app.repositories.base import load_sql


class PlayerStatsRepository:
    def __init__(self, conn):
        self.conn = conn

    # ── Idempotency guard ─────────────────────────────────────────────────────

    def is_event_applied(self, event_id: str) -> bool:
        result = self.conn.execute(
            load_sql("player_stats/is_event_applied.sql"), [event_id]
        ).fetchone()
        return bool(result[0]) if result else False

    def mark_event_applied(self, event_id: str) -> None:
        self.conn.execute(load_sql("player_stats/mark_event_applied.sql"), [event_id])

    # ── All-time stats upsert ─────────────────────────────────────────────────

    def upsert_player_stats(self, player_id: str, deltas: dict) -> None:
        """Increment all-time stats for one player by the given deltas."""
        event_wins_delta = deltas.get("event_wins_delta", 0)
        self.conn.execute(
            load_sql("player_stats/upsert_player_stats.sql"),
            [
                player_id,
                deltas.get("mexicano_score_delta", 0),
                deltas.get("rb_score_delta", 0),
                deltas.get("events_attended_delta", 0),
                deltas.get("wc_matches_played_delta", 0),
                deltas.get("wc_wins_delta", 0),
                deltas.get("wc_losses_delta", 0),
                deltas.get("rb_wins_delta", 0),
                deltas.get("rb_losses_delta", 0),
                deltas.get("rb_draws_delta", 0),
                deltas.get("mexicano_event_score", 0),  # candidate for GREATEST highscore
                event_wins_delta,
                event_wins_delta,  # second use: CASE WHEN ? = 1 THEN NOW()
            ],
        )

    # ── Monthly stats upsert ──────────────────────────────────────────────────

    def upsert_monthly_player_stats(
        self, player_id: str, year: int, month: int, deltas: dict
    ) -> None:
        """Increment monthly stats for one player by the given deltas."""
        self.conn.execute(
            load_sql("player_stats/upsert_monthly_player_stats.sql"),
            [
                player_id,
                year,
                month,
                deltas.get("events_played_delta", 0),
                deltas.get("mexicano_score_delta", 0),
                deltas.get("rb_score_delta", 0),
            ],
        )

    # ── Reads ─────────────────────────────────────────────────────────────────

    def get_player_stats(self, player_id: str) -> dict | None:
        """Return all-time stats row as a dict, or None if no row exists."""
        row = self.conn.execute(
            load_sql("player_stats/get_player_stats.sql"), [player_id]
        ).fetchone()
        if row is None:
            return None
        return {
            "player_id": row[0],
            "mexicano_score_total": row[1],
            "rb_score_total": row[2],
            "events_attended": row[3],
            "wc_matches_played": row[4],
            "wc_wins": row[5],
            "wc_losses": row[6],
            "rb_wins": row[7],
            "rb_losses": row[8],
            "rb_draws": row[9],
            "mexicano_best_event_score": row[10],
            "event_wins": row[11],
            "last_win_at": row[12],
        }

    def get_player_of_month(self, year: int, month: int) -> list[dict]:
        """Return monthly leaderboard ordered by events_played DESC, then score tiebreakers."""
        rows = self.conn.execute(
            load_sql("player_stats/get_player_of_month.sql"), [year, month]
        ).fetchall()
        return [
            {
                "player_id": row[0],
                "display_name": row[1],
                "events_played": row[2],
                "mexicano_score": row[3],
                "rb_score": row[4],
            }
            for row in rows
        ]

    def get_mexicano_of_month(self, year: int, month: int) -> list[dict]:
        """Return Mexicano monthly leaderboard ordered by mexicano_score DESC."""
        rows = self.conn.execute(
            load_sql("player_stats/get_mexicano_of_month.sql"), [year, month]
        ).fetchall()
        return [
            {
                "player_id": row[0],
                "display_name": row[1],
                "events_played": row[2],
                "mexicano_score": row[3],
                "rb_score": row[4],
            }
            for row in rows
        ]

    def get_ranked_box_ladder(self) -> list[dict]:
        """Return all-time Ranked Box ladder ordered by rb_score_total DESC."""
        rows = self.conn.execute(load_sql("player_stats/get_ranked_box_ladder.sql")).fetchall()
        return [
            {
                "player_id": row[0],
                "display_name": row[1],
                "rb_score_total": row[2],
                "rb_wins": row[3],
                "rb_losses": row[4],
                "rb_draws": row[5],
            }
            for row in rows
        ]

    def get_mexicano_highscore_ladder(self) -> list[dict]:
        """Return all-time Mexicano highscore ladder ordered by best single-event score DESC."""
        rows = self.conn.execute(
            load_sql("player_stats/get_mexicano_highscore_ladder.sql")
        ).fetchall()
        return [
            {
                "player_id": row[0],
                "display_name": row[1],
                "mexicano_best_event_score": row[2],
            }
            for row in rows
        ]

    def get_on_fire_player_ids(self) -> list[str]:
        """Return player IDs whose last_win_at is within the past 7 days."""
        rows = self.conn.execute(load_sql("player_stats/get_on_fire_player_ids.sql")).fetchall()
        return [row[0] for row in rows]

    def get_deep_dive_matches(self, player_id: str) -> list[dict]:
        """
        Return all completed matches for a player across all finished events,
        with event_type, is_team_mexicano, round_number, court_number, scores, etc.
        """
        rows = self.conn.execute(
            load_sql("player_stats/get_deep_dive_matches.sql"),
            [player_id, player_id, player_id, player_id, player_id, player_id],
        ).fetchall()
        return [
            {
                "event_type": row[0],
                "is_team_mexicano": bool(row[1]),
                "round_number": row[2],
                "court_number": row[3],
                "result_type": row[4],
                "team1_score": row[5],
                "team2_score": row[6],
                "winner_team": row[7],
                "is_draw": bool(row[8]),
                "player_team": row[9],
                "event_date": str(row[10]),
                "event_id": row[11],
            }
            for row in rows
        ]

    def reset_all_stats(self) -> None:
        """Clear all accumulated stats so events can be re-applied from scratch."""
        for table in (
            "player_stats",
            "monthly_player_stats",
            "player_stats_event_log",
            "global_rankings",
        ):
            self.conn.execute(f"DELETE FROM {table}")
        self.conn.execute("UPDATE players SET global_ranking_score = 0")

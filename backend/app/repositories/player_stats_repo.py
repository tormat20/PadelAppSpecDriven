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
        self.conn.execute(
            load_sql("player_stats/upsert_player_stats.sql"),
            [
                player_id,
                deltas.get("mexicano_score_delta", 0),
                deltas.get("btb_score_delta", 0),
                deltas.get("events_attended_delta", 0),
                deltas.get("wc_matches_played_delta", 0),
                deltas.get("wc_wins_delta", 0),
                deltas.get("wc_losses_delta", 0),
                deltas.get("btb_wins_delta", 0),
                deltas.get("btb_losses_delta", 0),
                deltas.get("btb_draws_delta", 0),
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
                deltas.get("btb_score_delta", 0),
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
            "btb_score_total": row[2],
            "events_attended": row[3],
            "wc_matches_played": row[4],
            "wc_wins": row[5],
            "wc_losses": row[6],
            "btb_wins": row[7],
            "btb_losses": row[8],
            "btb_draws": row[9],
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
                "btb_score": row[4],
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
                "btb_score": row[4],
            }
            for row in rows
        ]

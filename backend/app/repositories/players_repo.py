from app.domain.models import Player
from app.repositories.base import load_sql


class PlayersRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, player_id: str, display_name: str, email: str | None = None) -> Player:
        self.conn.execute(load_sql("players/create.sql"), [player_id, display_name, email])
        return self.get(player_id)

    def get(self, player_id: str) -> Player | None:
        row = self.conn.execute(load_sql("players/get_by_id.sql"), [player_id]).fetchone()
        if not row:
            return None
        return Player(id=row[0], display_name=row[1], global_ranking_score=row[2], email=row[3])

    def get_by_email(self, email: str) -> Player | None:
        row = self.conn.execute(load_sql("players/get_by_email.sql"), [email]).fetchone()
        if not row:
            return None
        return Player(id=row[0], display_name=row[1], global_ranking_score=row[2], email=row[3])

    def get_by_display_name(self, display_name: str) -> Player | None:
        row = self.conn.execute(
            load_sql("players/get_by_display_name.sql"), [display_name]
        ).fetchone()
        if not row:
            return None
        return Player(id=row[0], display_name=row[1], global_ranking_score=row[2], email=row[3])

    def search(self, query: str | None) -> list[Player]:
        term = "%" if not query else f"%{query}%"
        rows = self.conn.execute(load_sql("players/search.sql"), [term]).fetchall()
        return [
            Player(id=r[0], display_name=r[1], global_ranking_score=r[2], email=r[3]) for r in rows
        ]

    def delete(self, player_id: str) -> None:
        """Delete a single player and all their dependent rows in FK-safe order."""
        self.conn.execute(
            "DELETE FROM event_substitutions WHERE departing_player_id = ? OR substitute_player_id = ?",
            [player_id, player_id],
        )
        self.conn.execute(
            "DELETE FROM event_teams WHERE player1_id = ? OR player2_id = ?",
            [player_id, player_id],
        )
        for table in (
            "event_players",
            "event_scores",
            "player_round_scores",
            "global_rankings",
            "player_stats",
            "monthly_player_stats",
        ):
            self.conn.execute(f"DELETE FROM {table} WHERE player_id = ?", [player_id])
        self.conn.execute("DELETE FROM players WHERE id = ?", [player_id])

    def delete_all(self) -> None:
        """Delete every player and all their dependent rows in FK-safe order."""
        for table in (
            "event_substitutions",
            "event_teams",
            "event_players",
            "event_scores",
            "player_round_scores",
            "global_rankings",
            "player_stats",
            "monthly_player_stats",
            "player_stats_event_log",
            "players",
        ):
            self.conn.execute(f"DELETE FROM {table}")

    def update(self, player_id: str, display_name: str, email: str | None = None) -> Player | None:
        self.conn.execute(load_sql("players/update.sql"), [display_name, email, player_id])
        return self.get(player_id)

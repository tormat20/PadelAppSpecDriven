from app.repositories.base import load_sql


class RankingsRepository:
    def __init__(self, conn):
        self.conn = conn

    def get_global_rankings(self):
        return self.conn.execute(load_sql("rankings/get_global_rankings.sql")).fetchall()

    def apply_update(self, player_id: str, delta: int) -> None:
        self.conn.execute(load_sql("rankings/apply_update.sql"), [delta, player_id])

    def upsert_event_score(
        self,
        row_id: str,
        event_id: str,
        player_id: str,
        total_score: int,
        rank_position: int | None,
    ) -> None:
        self.conn.execute(
            load_sql("rankings/upsert_event_score.sql"),
            [row_id, event_id, player_id, total_score, rank_position],
        )

    def list_event_scores(self, event_id: str):
        return self.conn.execute(load_sql("rankings/list_event_scores.sql"), [event_id]).fetchall()

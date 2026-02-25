from app.domain.models import Player
from app.repositories.base import load_sql


class PlayersRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, player_id: str, display_name: str) -> Player:
        self.conn.execute(load_sql("players/create.sql"), [player_id, display_name])
        return self.get(player_id)

    def get(self, player_id: str) -> Player | None:
        row = self.conn.execute(load_sql("players/get_by_id.sql"), [player_id]).fetchone()
        if not row:
            return None
        return Player(id=row[0], display_name=row[1], global_ranking_score=row[2])

    def search(self, query: str | None) -> list[Player]:
        term = "%" if not query else f"%{query}%"
        rows = self.conn.execute(load_sql("players/search.sql"), [term]).fetchall()
        return [Player(id=r[0], display_name=r[1], global_ranking_score=r[2]) for r in rows]

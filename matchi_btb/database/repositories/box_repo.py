from domain.models import Box, Player

class BoxRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, event_id: int, box_number: int) -> int:
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO boxes (event_id, box_number) VALUES (?, ?)",
            (event_id, box_number)
        )
        self.conn.commit()
        return cur.lastrowid

    def add_player(self, box_id: int, player_id: int):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO box_players (box_id, player_id) VALUES (?, ?)",
            (box_id, player_id)
        )
        self.conn.commit()

    def get(self, box_id: int) -> Box | None:
        cur = self.conn.cursor()

        cur.execute(
            "SELECT id, event_id FROM boxes WHERE id = ?",
            (box_id,)
        )
        box_row = cur.fetchone()
        if not box_row:
            return None

        cur.execute("""
            SELECT p.id, p.name, p.points
            FROM players p
            JOIN box_players bp ON bp.player_id = p.id
            WHERE bp.box_id = ?
        """, (box_id,))
        rows = cur.fetchall()

        players = [
            Player(row["id"], row["name"], row["points"])
            for row in rows
        ]

        return Box(
            id=box_row["id"],
            event_id=box_row["event_id"],
            players=players
        )

    def list_by_event(self, event_id: int) -> list[Box]:
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id FROM boxes WHERE event_id = ?",
            (event_id,)
        )
        return [self.get(row["id"]) for row in cur.fetchall()]

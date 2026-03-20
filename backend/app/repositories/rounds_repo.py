from app.domain.enums import RoundStatus
from app.domain.models import Round
from app.repositories.base import load_sql


class RoundsRepository:
    def __init__(self, conn):
        self.conn = conn

    def create_round(
        self, round_id: str, event_id: str, round_number: int, status: RoundStatus
    ) -> Round:
        self.conn.execute(
            load_sql("rounds/create_round.sql"),
            [round_id, event_id, round_number, status.value],
        )
        return Round(id=round_id, event_id=event_id, round_number=round_number, status=status)

    def get_current_round(self, event_id: str) -> Round | None:
        row = self.conn.execute(load_sql("rounds/get_current_round.sql"), [event_id]).fetchone()
        if not row:
            return None
        return Round(id=row[0], event_id=row[1], round_number=row[2], status=RoundStatus(row[3]))

    def list_rounds(self, event_id: str) -> list[Round]:
        rows = self.conn.execute(load_sql("rounds/list_rounds.sql"), [event_id]).fetchall()
        return [
            Round(id=r[0], event_id=r[1], round_number=r[2], status=RoundStatus(r[3])) for r in rows
        ]

    def set_status(self, round_id: str, status: RoundStatus) -> None:
        self.conn.execute(load_sql("rounds/set_status.sql"), [status.value, round_id])

    def get_round_by_number(self, event_id: str, round_number: int) -> Round | None:
        row = self.conn.execute(
            "SELECT id, event_id, round_number, status FROM rounds WHERE event_id = ? AND round_number = ?",
            [event_id, round_number],
        ).fetchone()
        if not row:
            return None
        return Round(id=row[0], event_id=row[1], round_number=row[2], status=RoundStatus(row[3]))

    def delete_from_round_number(self, event_id: str, from_round_number: int) -> None:
        self.conn.execute(
            """
            DELETE FROM matches
            WHERE event_id = ?
              AND round_id IN (
                SELECT id FROM rounds WHERE event_id = ? AND round_number >= ?
              )
            """,
            [event_id, event_id, from_round_number],
        )
        self.conn.execute(
            "DELETE FROM rounds WHERE event_id = ? AND round_number >= ?",
            [event_id, from_round_number],
        )

    def list_round_numbers(self, event_id: str) -> list[int]:
        rows = self.conn.execute(
            "SELECT round_number FROM rounds WHERE event_id = ? ORDER BY round_number",
            [event_id],
        ).fetchall()
        return [int(r[0]) for r in rows]

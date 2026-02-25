from datetime import date

from app.domain.enums import EventStatus, EventType
from app.domain.models import Event
from app.repositories.base import load_sql


class EventsRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(
        self,
        event_id: str,
        event_name: str,
        event_type: EventType,
        event_date: date,
        status: EventStatus,
        round_count: int,
        round_duration_minutes: int,
        current_round_number: int | None,
    ) -> Event:
        self.conn.execute(
            load_sql("events/create.sql"),
            [
                event_id,
                event_name,
                event_type.value,
                event_date.isoformat(),
                status.value,
                round_count,
                round_duration_minutes,
                current_round_number,
            ],
        )
        return self.get(event_id)

    def get(self, event_id: str) -> Event | None:
        row = self.conn.execute(load_sql("events/get_by_id.sql"), [event_id]).fetchone()
        if not row:
            return None
        return Event(
            id=row[0],
            event_name=row[1],
            event_type=EventType(row[2]),
            event_date=date.fromisoformat(str(row[3])),
            status=EventStatus(row[4]),
            round_count=row[5],
            round_duration_minutes=row[6],
            current_round_number=row[7],
        )

    def add_player(
        self, row_id: str, event_id: str, player_id: str, seed_order: int | None
    ) -> None:
        self.conn.execute(
            load_sql("events/add_player.sql"), [row_id, event_id, player_id, seed_order]
        )

    def add_court(self, row_id: str, event_id: str, court_number: int) -> None:
        self.conn.execute(load_sql("events/add_court.sql"), [row_id, event_id, court_number])

    def set_status(
        self, event_id: str, status: EventStatus, current_round_number: int | None
    ) -> None:
        self.conn.execute(
            load_sql("events/set_status.sql"), [status.value, current_round_number, event_id]
        )

    def list_player_ids(self, event_id: str) -> list[str]:
        rows = self.conn.execute(load_sql("events/list_player_ids.sql"), [event_id]).fetchall()
        return [r[0] for r in rows]

    def list_courts(self, event_id: str) -> list[int]:
        rows = self.conn.execute(load_sql("events/list_courts.sql"), [event_id]).fetchall()
        return [r[0] for r in rows]

from datetime import date

from app.domain.enums import EventStatus, EventType, SetupStatus
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
        event_duration_minutes: int,
        current_round_number: int | None,
        event_time: str | None,
        setup_status: SetupStatus,
        version: int,
        is_team_mexicano: bool = False,
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
                event_duration_minutes,
                current_round_number,
                event_time,
                setup_status.value,
                version,
                is_team_mexicano,
            ],
        )
        event = self.get(event_id)
        if event is None:
            raise RuntimeError("Created event could not be loaded")
        return event

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
            event_duration_minutes=row[7],
            current_round_number=row[8],
            event_time=row[9],
            setup_status=SetupStatus(row[10]),
            version=row[11],
            is_team_mexicano=bool(row[12]),
        )

    def list_all(self) -> list[Event]:
        rows = self.conn.execute(load_sql("events/list_all.sql")).fetchall()
        return [
            Event(
                id=row[0],
                event_name=row[1],
                event_type=EventType(row[2]),
                event_date=date.fromisoformat(str(row[3])),
                status=EventStatus(row[4]),
                round_count=row[5],
                round_duration_minutes=row[6],
                event_duration_minutes=row[7],
                current_round_number=row[8],
                event_time=row[9],
                setup_status=SetupStatus(row[10]),
                version=row[11],
                is_team_mexicano=bool(row[12]),
            )
            for row in rows
        ]

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

    def count_duplicate_slots(
        self,
        event_name: str,
        event_date: date,
        event_time: str | None,
        exclude_event_id: str | None = None,
    ) -> int:
        row = self.conn.execute(
            load_sql("events/count_duplicates.sql"),
            [event_name, event_date.isoformat(), event_time, exclude_event_id],
        ).fetchone()
        return int(row[0]) if row else 0

    def replace_players(self, event_id: str, player_ids: list[str]) -> None:
        self.conn.execute("DELETE FROM event_players WHERE event_id = ?", [event_id])
        for idx, player_id in enumerate(player_ids):
            self.add_player(
                row_id=f"{event_id}-p-{idx}",
                event_id=event_id,
                player_id=player_id,
                seed_order=idx + 1,
            )

    def replace_courts(self, event_id: str, courts: list[int]) -> None:
        self.conn.execute("DELETE FROM event_courts WHERE event_id = ?", [event_id])
        for idx, court_number in enumerate(courts):
            self.add_court(
                row_id=f"{event_id}-c-{idx}", event_id=event_id, court_number=court_number
            )

    def update_setup(
        self,
        event_id: str,
        event_name: str,
        event_type: EventType,
        event_date: date,
        event_time: str | None,
        event_duration_minutes: int,
        setup_status: SetupStatus,
        is_team_mexicano: bool = False,
    ) -> None:
        self.conn.execute(
            load_sql("events/update_setup.sql"),
            [
                event_name,
                event_type.value,
                event_date.isoformat(),
                event_time,
                event_duration_minutes,
                setup_status.value,
                is_team_mexicano,
                event_id,
            ],
        )

    def delete_event(self, event_id: str) -> bool:
        existing = self.get(event_id)
        if existing is None:
            return False

        self.clear_event_runtime(event_id)
        self.conn.execute("DELETE FROM event_players WHERE event_id = ?", [event_id])
        self.conn.execute("DELETE FROM event_courts WHERE event_id = ?", [event_id])
        self.conn.execute("DELETE FROM events WHERE id = ?", [event_id])
        return True

    def clear_event_runtime(self, event_id: str) -> None:
        self.conn.execute("DELETE FROM event_scores WHERE event_id = ?", [event_id])
        self.conn.execute(
            "DELETE FROM player_round_scores WHERE event_id = ?",
            [event_id],
        )
        self.conn.execute("DELETE FROM matches WHERE event_id = ?", [event_id])
        self.conn.execute("DELETE FROM rounds WHERE event_id = ?", [event_id])

    def list_by_date_range(self, from_date: date, to_date: date) -> list[Event]:
        rows = self.conn.execute(
            load_sql("events/list_by_date_range.sql"),
            [from_date.isoformat(), to_date.isoformat()],
        ).fetchall()
        return [
            Event(
                id=row[0],
                event_name=row[1],
                event_type=EventType(row[2]),
                event_date=date.fromisoformat(str(row[3])),
                status=EventStatus(row[4]),
                round_count=row[5],
                round_duration_minutes=row[6],
                event_duration_minutes=row[7],
                current_round_number=row[8],
                event_time=row[9],
                setup_status=SetupStatus(row[10]),
                version=row[11],
                is_team_mexicano=bool(row[12]),
            )
            for row in rows
        ]

    def update_round_count(self, event_id: str, round_count: int) -> None:
        self.conn.execute(
            "UPDATE events SET round_count = ? WHERE id = ?",
            [round_count, event_id],
        )

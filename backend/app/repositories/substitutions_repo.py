from app.domain.models import EventSubstitution
from app.repositories.base import load_sql


class SubstitutionsRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(
        self,
        sub_id: str,
        event_id: str,
        departing_id: str,
        substitute_id: str,
        from_round: int,
    ) -> EventSubstitution:
        self.conn.execute(
            load_sql("substitutions/create.sql"),
            [sub_id, event_id, departing_id, substitute_id, from_round],
        )
        rows = self.conn.execute(load_sql("substitutions/list_by_event.sql"), [event_id]).fetchall()
        for row in rows:
            if row[0] == sub_id:
                return EventSubstitution(
                    id=row[0],
                    event_id=row[1],
                    departing_player_id=row[2],
                    substitute_player_id=row[3],
                    effective_from_round=row[4],
                )
        raise RuntimeError("Created substitution record could not be loaded")

    def list_by_event(self, event_id: str) -> list[EventSubstitution]:
        rows = self.conn.execute(load_sql("substitutions/list_by_event.sql"), [event_id]).fetchall()
        return [
            EventSubstitution(
                id=row[0],
                event_id=row[1],
                departing_player_id=row[2],
                substitute_player_id=row[3],
                effective_from_round=row[4],
            )
            for row in rows
        ]

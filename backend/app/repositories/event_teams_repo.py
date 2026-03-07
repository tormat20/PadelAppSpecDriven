from app.domain.models import EventTeam
from app.repositories.base import load_sql


class EventTeamsRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, team_id: str, event_id: str, player1_id: str, player2_id: str) -> EventTeam:
        self.conn.execute(
            load_sql("event_teams/create.sql"),
            [team_id, event_id, player1_id, player2_id],
        )
        rows = self.conn.execute(load_sql("event_teams/list_by_event.sql"), [event_id]).fetchall()
        for row in rows:
            if row[0] == team_id:
                return EventTeam(
                    id=row[0],
                    event_id=row[1],
                    player1_id=row[2],
                    player2_id=row[3],
                )
        raise RuntimeError("Created event team could not be loaded")

    def list_by_event(self, event_id: str) -> list[EventTeam]:
        rows = self.conn.execute(load_sql("event_teams/list_by_event.sql"), [event_id]).fetchall()
        return [
            EventTeam(
                id=row[0],
                event_id=row[1],
                player1_id=row[2],
                player2_id=row[3],
            )
            for row in rows
        ]

    def delete_by_event(self, event_id: str) -> None:
        self.conn.execute(load_sql("event_teams/delete_by_event.sql"), [event_id])

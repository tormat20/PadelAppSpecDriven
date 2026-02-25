from domain.models import Player
from domain.models import Event

from datetime import date

class EventRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, name, event_date):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO events (name, date) VALUES (?, ?)",
            (name, event_date)
        )
        self.conn.commit()
        return cur.lastrowid

    def add_player(self, event_id, player_id):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO event_players (event_id, player_id) VALUES (?, ?)",
            (event_id, player_id)
        )
        self.conn.commit()

    def get_event(self,event_id):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, date, name FROM events WHERE id = ?",
            (event_id,)
        )
        row = cur.fetchone()

        if row is None:
            return None
    
    
        return Event(
            id=row["id"],
            name=row["name"],
            date=date.fromisoformat(row["date"])
        )
    
    def list_all(self):
            cur = self.conn.cursor()
            cur.execute("SELECT id, name, date FROM events")
            rows = cur.fetchall()

            return [
                Event(
                    id=row["id"],
                    name=row["name"],
                    date=row["date"]
                )
                for row in rows
            ]
    

    def get_players(self, event_id):
        cur = self.conn.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.points
            FROM players p
            JOIN event_players ep ON p.id = ep.player_id
            WHERE ep.event_id = ?
        """, (event_id,))
        rows = cur.fetchall()

        return [
                Player(
                    id=row["id"],
                    name=row["name"],
                    points=row["points"]
                )
                for row in rows
            ]
    


from domain.models import Player

class PlayerRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, name):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO players (name) VALUES (?)",
            (name,)
        )
        self.conn.commit()
        return cur.lastrowid

    def list_all(self):
            cur = self.conn.cursor()
            cur.execute("SELECT id, name, points FROM players")
            rows = cur.fetchall()

            return [
                Player(
                    id=row["id"],
                    name=row["name"],
                    points=row["points"]
                )
                for row in rows
            ]
    def list_all_by_points(self):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, name, points FROM players ORDER BY points DESC"
        )
        rows = cur.fetchall()

        return [
            Player(
                id=row["id"],
                name=row["name"],
                points=row["points"]
            )
            for row in rows
        ]

    def get(self, player_id):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, name, points FROM players WHERE id = ?",
            (player_id,)
        )
        row = cur.fetchone()

        if row is None:
            return None

        return Player(
            id=row["id"],
            name=row["name"],
            points=row["points"]
        )
    
    def get_by_name(self, name):
        cur = self.conn.cursor()
        cur.execute(
            "SELECT id, name, points FROM players WHERE name = ?",
            (name,)
        )
        return cur.fetchone()

    def update_points(self, player_id, delta):
        cur = self.conn.cursor()
        cur.execute(
            "UPDATE players SET points = points + ? WHERE id = ?",
            (delta, player_id)
        )
        self.conn.commit()

    
 

from domain.models import Match, Player
# from player_repo import PlayerRepository 

class MatchRepository:
    def __init__(self, conn):
        self.conn = conn


    def create(self, box_id: int) -> int:
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO matches (box_id) VALUES (?)",
            (box_id,)
        )
        self.conn.commit()
        return cur.lastrowid

    def add_team(self, match_id: int, players: list[Player], team: int):
        cur = self.conn.cursor()

        for player in players:
            cur.execute(
                "INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)",
                (match_id, player.id, team)
            )

        self.conn.commit()

    def add_player(self, match_id, player_id, team):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT INTO match_players (match_id, player_id, team) VALUES (?, ?, ?)",
            (match_id, player_id, team)
        )
        self.conn.commit()

    def set_result(self, match_id: int, winning_team: int):
        cur = self.conn.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO match_results (match_id, winning_team) VALUES (?, ?)",
            (match_id, winning_team)
        )
        self.conn.commit()

    def get_result(self, match_id: int) -> int | None:
        cur = self.conn.cursor()
        cur.execute(
            "SELECT winning_team FROM match_results WHERE match_id = ?",
            (match_id,)
        )
        row = cur.fetchone()
        return row["winning_team"] if row else None

    def get_match(self, match_id: int) -> Match | None:
        cur = self.conn.cursor()

        # Match row
        cur.execute(
            "SELECT id, box_id FROM matches WHERE id = ?",
            (match_id,)
        )
        match_row = cur.fetchone()

        if match_row is None:
            return None

        # Players
        cur.execute("""
            SELECT p.id, p.name, p.points, mp.team
            FROM match_players mp
            JOIN players p ON p.id = mp.player_id
            WHERE mp.match_id = ?
        """, (match_id,))
        rows = cur.fetchall()

        team1, team2 = [], []

        for row in rows:
            player = Player(
                id=row["id"],
                name=row["name"],
                points=row["points"]
            )
            (team1 if row["team"] == 1 else team2).append(player)

        winning_team = self.get_result(match_id)

        return Match(
            id=match_row["id"],
            box_id=match_row["box_id"],
            team1=team1,
            team2=team2,
            winning_team=winning_team
        )

    def get_partner(self, match_id: int, player_id: int) -> Player | None:
        cur = self.conn.cursor()

        cur.execute("""
            SELECT p.id, p.name, p.points
            FROM match_players mp1
            JOIN match_players mp2
              ON mp1.match_id = mp2.match_id
             AND mp1.team = mp2.team
             AND mp1.player_id != mp2.player_id
            JOIN players p ON p.id = mp2.player_id
            WHERE mp1.match_id = ?
              AND mp1.player_id = ?
        """, (match_id, player_id))

        row = cur.fetchone()

        if row is None:
            return None

        return Player(
            id=row["id"],
            name=row["name"],
            points=row["points"]
        )
    
    def get_player_team(self, match_id: int, player_id: int) -> int | None:
        cur = self.conn.cursor()
        cur.execute(
            "SELECT team FROM match_players WHERE match_id = ? AND player_id = ?",
            (match_id, player_id)
        )
        row = cur.fetchone()
        return row["team"] if row else None


    def get_team(self, match_id: int, team: int) -> list[Player]:
        cur = self.conn.cursor()
        cur.execute("""
            SELECT p.id, p.name, p.points
            FROM match_players mp
            JOIN players p ON p.id = mp.player_id
            WHERE mp.match_id = ?
            AND mp.team = ?
        """, (match_id, team))

        rows = cur.fetchall()
        return [Player(row["id"], row["name"], row["points"]) for row in rows]


    def get_opposite_team(self, match_id: int, player_id: int) -> list[Player]:
        team = self.get_player_team(match_id, player_id)
        if team not in (1, 2):
            return []

        return self.get_team(match_id, 2 if team == 1 else 1)

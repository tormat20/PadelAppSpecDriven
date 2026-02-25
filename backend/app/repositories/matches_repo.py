from app.domain.enums import MatchStatus, ResultType
from app.domain.models import Match, RoundPlanMatch
from app.repositories.base import load_sql


class MatchesRepository:
    def __init__(self, conn):
        self.conn = conn

    def create_matches_bulk(
        self, event_id: str, round_id: str, matches: list[tuple[str, RoundPlanMatch]]
    ) -> None:
        for match_id, match in matches:
            self.conn.execute(
                load_sql("matches/create.sql"),
                [
                    match_id,
                    event_id,
                    round_id,
                    match.court_number,
                    match.team1[0],
                    match.team1[1],
                    match.team2[0],
                    match.team2[1],
                    match.result_type.value,
                    None,
                    False,
                    None,
                    None,
                    MatchStatus.PENDING.value,
                ],
            )

    def list_by_round(self, round_id: str) -> list[Match]:
        rows = self.conn.execute(load_sql("matches/list_by_round.sql"), [round_id]).fetchall()
        return [self._to_match(r) for r in rows]

    def get(self, match_id: str) -> Match | None:
        row = self.conn.execute(load_sql("matches/get_by_id.sql"), [match_id]).fetchone()
        if not row:
            return None
        return self._to_match(row)

    def set_result(
        self,
        match_id: str,
        winner_team: int | None,
        is_draw: bool,
        team1_score: int | None,
        team2_score: int | None,
    ) -> None:
        self.conn.execute(
            load_sql("matches/set_result.sql"),
            [winner_team, is_draw, team1_score, team2_score, match_id],
        )

    def count_pending_in_round(self, round_id: str) -> int:
        row = self.conn.execute(
            load_sql("matches/count_pending_in_round.sql"), [round_id]
        ).fetchone()
        return int(row[0]) if row else 0

    def _to_match(self, row) -> Match:
        return Match(
            id=row[0],
            event_id=row[1],
            round_id=row[2],
            court_number=row[3],
            team1_player1_id=row[4],
            team1_player2_id=row[5],
            team2_player1_id=row[6],
            team2_player2_id=row[7],
            result_type=ResultType(row[8]),
            winner_team=row[9],
            is_draw=bool(row[10]),
            team1_score=row[11],
            team2_score=row[12],
            status=MatchStatus(row[13]),
        )

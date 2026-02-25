from collections import defaultdict
from uuid import uuid4

from app.domain.enums import EventType, RoundStatus
from app.domain.scoring import americano_score, beat_the_box_delta, mexicano_score
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.rankings_repo import RankingsRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.americano_service import AmericanoService
from app.services.beat_the_box_service import BeatTheBoxService
from app.services.mexicano_service import MexicanoService


class RoundService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
        rankings_repo: RankingsRepository,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.rankings_repo = rankings_repo
        self.americano_service = AmericanoService()
        self.mexicano_service = MexicanoService()
        self.btb_service = BeatTheBoxService()

    def get_current_round_view(self, event_id: str) -> dict:
        round_obj = self.rounds_repo.get_current_round(event_id)
        if not round_obj:
            raise ValueError("Round not found")
        matches = self.matches_repo.list_by_round(round_obj.id)
        return {
            "event_id": event_id,
            "round_number": round_obj.round_number,
            "matches": matches,
        }

    def record_result(self, match_id: str, mode: str, payload: dict) -> None:
        match = self.matches_repo.get(match_id)
        if not match:
            raise ValueError("Match not found")

        winner_team: int | None = None
        is_draw = False
        team1_score: int | None = None
        team2_score: int | None = None

        if mode == "Americano":
            winner_team = payload.get("winningTeam")
            americano_score(winner_team)
        elif mode == "Mexicano":
            team1_score, team2_score = mexicano_score(
                payload.get("team1Score"), payload.get("team2Score")
            )
            if team1_score != team2_score:
                winner_team = 1 if team1_score > team2_score else 2
            else:
                is_draw = True
        elif mode == "BeatTheBox":
            outcome = payload.get("outcome")
            d1, d2 = beat_the_box_delta(outcome)
            if outcome == "Draw":
                is_draw = True
            else:
                winner_team = 1 if outcome == "Team1Win" else 2
            self.rankings_repo.apply_update(match.team1_player1_id, d1)
            self.rankings_repo.apply_update(match.team1_player2_id, d1)
            self.rankings_repo.apply_update(match.team2_player1_id, d2)
            self.rankings_repo.apply_update(match.team2_player2_id, d2)
        else:
            raise ValueError("Unsupported mode")

        self.matches_repo.set_result(match_id, winner_team, is_draw, team1_score, team2_score)

    def next_round(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        current_round = self.rounds_repo.get_current_round(event_id)
        if not current_round:
            raise ValueError("No current round")

        if self.matches_repo.count_pending_in_round(current_round.id) > 0:
            raise ValueError("Cannot advance with pending matches")

        self.rounds_repo.set_status(current_round.id, RoundStatus.COMPLETED)
        if current_round.round_number >= event.round_count:
            raise ValueError("Final round reached")

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        if event.event_type == EventType.AMERICANO:
            plan = self.americano_service.generate_next_round(
                current_round.round_number, player_ids, courts
            )
        elif event.event_type == EventType.MEXICANO:
            plan = self.mexicano_service.generate_next_round(
                current_round.round_number, player_ids, courts
            )
        else:
            plan = self.btb_service.generate_next_round(
                current_round.round_number, player_ids, courts
            )

        round_id = str(uuid4())
        self.rounds_repo.create_round(round_id, event_id, plan.round_number, RoundStatus.RUNNING)
        self.matches_repo.create_matches_bulk(
            event_id, round_id, [(str(uuid4()), m) for m in plan.matches]
        )
        self.events_repo.set_status(event_id, event.status, plan.round_number)
        return self.get_current_round_view(event_id)

    def summarize(self, event_id: str) -> dict:
        rounds = self.rounds_repo.list_rounds(event_id)
        all_matches = []
        player_totals: dict[str, int] = defaultdict(int)
        for round_obj in rounds:
            matches = self.matches_repo.list_by_round(round_obj.id)
            all_matches.extend(matches)
            for match in matches:
                if match.result_type.value == "Score24":
                    player_totals[match.team1_player1_id] += match.team1_score or 0
                    player_totals[match.team1_player2_id] += match.team1_score or 0
                    player_totals[match.team2_player1_id] += match.team2_score or 0
                    player_totals[match.team2_player2_id] += match.team2_score or 0
                elif match.result_type.value == "WinLossDraw":
                    if match.is_draw:
                        delta1 = delta2 = 5
                    elif match.winner_team == 1:
                        delta1, delta2 = 25, -15
                    else:
                        delta1, delta2 = -15, 25
                    player_totals[match.team1_player1_id] += delta1
                    player_totals[match.team1_player2_id] += delta1
                    player_totals[match.team2_player1_id] += delta2
                    player_totals[match.team2_player2_id] += delta2
                else:
                    if match.winner_team == 1:
                        player_totals[match.team1_player1_id] += 1
                        player_totals[match.team1_player2_id] += 1
                    elif match.winner_team == 2:
                        player_totals[match.team2_player1_id] += 1
                        player_totals[match.team2_player2_id] += 1

        ordered = sorted(player_totals.items(), key=lambda kv: kv[1], reverse=True)
        for idx, (player_id, total) in enumerate(ordered, start=1):
            self.rankings_repo.upsert_event_score(str(uuid4()), event_id, player_id, total, idx)

        standings = self.rankings_repo.list_event_scores(event_id)
        return {
            "event_id": event_id,
            "rounds": rounds,
            "matches": all_matches,
            "standings": standings,
        }

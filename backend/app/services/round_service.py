from collections import defaultdict
from datetime import datetime, timezone
from uuid import uuid4

from app.core.errors import DomainError
from app.domain.enums import EventType, MatchStatus, RoundStatus
from app.domain.scoring import winners_court_score, ranked_box_delta, mexicano_score
from app.repositories.event_teams_repo import EventTeamsRepository
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.rankings_repo import RankingsRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.winners_court_service import WinnersCourtService
from app.services.ranked_box_service import RankedBoxService
from app.services.event_lifecycle import derive_lifecycle_status
from app.services.mexicano_service import MexicanoService
from app.services.team_mexicano_service import TeamMexicanoService, build_last_round_opponent_pairs


class RoundService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
        rankings_repo: RankingsRepository,
        event_teams_repo: EventTeamsRepository | None = None,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.rankings_repo = rankings_repo
        self.event_teams_repo = event_teams_repo
        self.winners_court_service = WinnersCourtService()
        self.mexicano_service = MexicanoService()
        self.team_mexicano_service = TeamMexicanoService()
        self.rb_service = RankedBoxService()

    def go_previous_round(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)

        lifecycle_status = derive_lifecycle_status(event)
        if lifecycle_status != "ongoing":
            raise DomainError(
                "EVENT_NOT_ONGOING",
                "Event is not running right now.",
                status_code=409,
            )

        current_round = self.rounds_repo.get_current_round(event_id)
        if not current_round:
            raise DomainError(
                "ROUND_NOT_FOUND",
                "No active round found for this event.",
                status_code=404,
            )

        if current_round.round_number <= 1:
            return {
                "status": "blocked",
                "warningMessage": "Round 1 is the first round. You cannot go back further.",
                "roundView": None,
            }

        previous_round_number = current_round.round_number - 1
        previous_round = self.rounds_repo.get_round_by_number(event_id, previous_round_number)
        if not previous_round:
            raise DomainError(
                "ROUND_NOT_FOUND",
                "Previous round could not be loaded.",
                status_code=404,
            )

        self.rounds_repo.delete_from_round_number(event_id, current_round.round_number)
        self.rounds_repo.set_status(previous_round.id, RoundStatus.RUNNING)
        self.events_repo.set_status(event_id, event.status, previous_round.round_number)
        self._rebuild_event_score_projections(event_id)

        return {
            "status": "ok",
            "warningMessage": None,
            "roundView": self.get_current_round_view(event_id),
        }

    def get_current_round_view(self, event_id: str) -> dict:
        round_obj = self.rounds_repo.get_current_round(event_id)
        if not round_obj:
            raise DomainError(
                "ROUND_NOT_FOUND",
                "No active round found for this event.",
                status_code=404,
            )
        matches = self.matches_repo.list_by_round(round_obj.id)
        return {
            "event_id": event_id,
            "round_number": round_obj.round_number,
            "matches": matches,
        }

    def record_result(self, match_id: str, mode: str, payload: dict[str, object]) -> None:
        match = self.matches_repo.get(match_id)
        if not match:
            raise ValueError("Match not found")

        self._apply_result(match, mode, payload, allow_rankedbox_updates=True)

    def correct_result(
        self,
        match_id: str,
        mode: str,
        payload: dict[str, object],
        edited_by_user_id: str,
        expected_updated_at: str | None = None,
    ) -> dict[str, str]:
        match = self.matches_repo.get(match_id)
        if not match:
            raise ValueError("Match not found")

        if expected_updated_at and match.updated_at and expected_updated_at != match.updated_at:
            raise DomainError(
                "RESULT_CONFLICT",
                "Result was updated by another user. Refresh and try again.",
                status_code=409,
            )

        if mode == "RankedBox" and match.status == MatchStatus.COMPLETED:
            raise DomainError(
                "RESULT_EDIT_NOT_SUPPORTED",
                "RankedBox completed results are not editable.",
                status_code=409,
            )

        before_payload = {
            "winnerTeam": match.winner_team,
            "isDraw": bool(match.is_draw),
            "team1Score": match.team1_score,
            "team2Score": match.team2_score,
            "status": match.status.value,
        }

        self._apply_result(match, mode, payload, allow_rankedbox_updates=False)
        updated = self.matches_repo.get(match_id)
        edited_at = datetime.now(timezone.utc).isoformat()
        after_payload = {
            "winnerTeam": updated.winner_team if updated else None,
            "isDraw": bool(updated.is_draw) if updated else False,
            "team1Score": updated.team1_score if updated else None,
            "team2Score": updated.team2_score if updated else None,
            "status": updated.status.value if updated else "Completed",
        }
        self.matches_repo.insert_result_correction(
            event_id=match.event_id,
            match_id=match_id,
            edited_by_user_id=edited_by_user_id,
            before_payload=before_payload,
            after_payload=after_payload,
            status="applied",
        )

        self._invalidate_downstream_rounds_after_correction(match)

        return {
            "status": "applied",
            "matchId": match_id,
            "editedAt": edited_at,
        }

    def _apply_result(
        self,
        match,
        mode: str,
        payload: dict[str, object],
        allow_rankedbox_updates: bool,
    ) -> None:

        winner_team: int | None = None
        is_draw = False
        team1_score: int | None = None
        team2_score: int | None = None

        if mode == "WinnersCourt":
            raw_winner = payload.get("winningTeam")
            if not isinstance(raw_winner, int) or raw_winner not in (1, 2):
                raise ValueError("WinnersCourt requires a winning team")
            winner_team = raw_winner
            winners_court_score(winner_team)
        elif mode in ("Mexicano", "Americano"):
            raw_team1 = payload.get("team1Score")
            raw_team2 = payload.get("team2Score")
            if not isinstance(raw_team1, int) or not isinstance(raw_team2, int):
                raise ValueError("Mexicano requires numeric team scores")
            team1_score, team2_score = mexicano_score(
                int(raw_team1),
                int(raw_team2),
            )
            if team1_score != team2_score:
                winner_team = 1 if team1_score > team2_score else 2
            else:
                is_draw = True
        elif mode == "RankedBox":
            outcome = payload.get("outcome")
            if not isinstance(outcome, str):
                raise ValueError("RankedBox requires an outcome")
            d1, d2 = ranked_box_delta(str(outcome))
            if outcome == "Draw":
                is_draw = True
            else:
                winner_team = 1 if outcome == "Team1Win" else 2
            if allow_rankedbox_updates:
                self.rankings_repo.apply_update(match.team1_player1_id, d1)
                self.rankings_repo.apply_update(match.team1_player2_id, d1)
                self.rankings_repo.apply_update(match.team2_player1_id, d2)
                self.rankings_repo.apply_update(match.team2_player2_id, d2)
        else:
            raise ValueError("Unsupported mode")

        self.matches_repo.set_result(match.id, winner_team, is_draw, team1_score, team2_score)

    def _invalidate_downstream_rounds_after_correction(self, match) -> None:
        event = self.events_repo.get(match.event_id)
        if not event:
            return

        corrected_round = self._round_for_match(match.event_id, match.round_id)
        if not corrected_round:
            return

        from_round = corrected_round.round_number + 1
        if self.rounds_repo.list_round_numbers(match.event_id):
            self.rounds_repo.delete_from_round_number(match.event_id, from_round)

        self.rounds_repo.set_status(corrected_round.id, RoundStatus.RUNNING)
        self.events_repo.set_status(match.event_id, event.status, corrected_round.round_number)
        self._rebuild_event_score_projections(match.event_id)

    def _round_for_match(self, event_id: str, round_id: str):
        for round_obj in self.rounds_repo.list_rounds(event_id):
            if round_obj.id == round_id:
                return round_obj
        return None

    def _rebuild_event_score_projections(self, event_id: str) -> None:
        event = self.events_repo.get(event_id)
        if not event:
            return

        self.matches_repo.clear_event_score_projections(event_id)
        if event.event_type not in (EventType.MEXICANO, EventType.AMERICANO):
            return

        player_ids = self.events_repo.list_player_ids(event_id)
        if not player_ids:
            return

        if event.event_type == EventType.MEXICANO and not event.is_team_mexicano:
            ordered_players, totals = self._rank_players_for_mexicano(event_id, player_ids)
            self._upsert_event_scores(event_id, ordered_players, totals)
            return

        totals = self._calculate_player_totals(event_id, player_ids)
        self._upsert_event_scores(event_id, player_ids, totals)

    def next_round(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)

        lifecycle_status = derive_lifecycle_status(event)
        if lifecycle_status != "ongoing":
            raise DomainError(
                "EVENT_NOT_ONGOING",
                "Event must be ongoing to advance rounds.",
                status_code=409,
            )

        current_round = self.rounds_repo.get_current_round(event_id)
        if not current_round:
            raise DomainError(
                "ROUND_NOT_FOUND",
                "No active round found for this event.",
                status_code=404,
            )

        if self.matches_repo.count_pending_in_round(current_round.id) > 0:
            raise DomainError(
                "ROUND_PENDING_RESULTS",
                "Submit all match results before advancing to the next round.",
                status_code=409,
            )

        self.rounds_repo.set_status(current_round.id, RoundStatus.COMPLETED)
        if current_round.round_number >= event.round_count and event.event_type not in (
            EventType.MEXICANO,
            EventType.AMERICANO,
        ):
            raise DomainError(
                "EVENT_FINAL_ROUND_REACHED",
                "Final round reached. Finish the event to view summary.",
                status_code=409,
            )

        # For Americano: the next round is already pre-stored; look it up and set it Running.
        if event.event_type == EventType.AMERICANO:
            next_round_number = current_round.round_number + 1
            if next_round_number > event.round_count:
                raise DomainError(
                    "EVENT_FINAL_ROUND_REACHED",
                    "Final round reached. Finish the event to view summary.",
                    status_code=409,
                )
            next_round_obj = self.rounds_repo.get_round_by_number(event_id, next_round_number)
            if not next_round_obj:
                raise DomainError(
                    "ROUND_NOT_FOUND",
                    f"Pre-stored round {next_round_number} not found for Americano event.",
                    status_code=404,
                )
            self.rounds_repo.set_status(next_round_obj.id, RoundStatus.RUNNING)
            self.events_repo.set_status(event_id, event.status, next_round_number)
            return self.get_current_round_view(event_id)

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        current_matches = self.matches_repo.list_by_round(current_round.id)
        partner_history = self._build_previous_partner_map(current_matches)
        event_seed = f"{event_id}:{current_round.round_number + 1}"

        if event.event_type == EventType.WINNERS_COURT:
            plan = self.winners_court_service.generate_next_round(
                current_round.round_number,
                player_ids,
                courts,
                previous_matches=current_matches,
                partner_history=partner_history,
                event_seed=event_seed,
            )
        elif event.event_type == EventType.MEXICANO:
            if event.is_team_mexicano and self.event_teams_repo:
                fixed_teams_objs = self.event_teams_repo.list_by_event(event_id)
                fixed_teams = [(t.player1_id, t.player2_id) for t in fixed_teams_objs]
                totals = self._calculate_player_totals(event_id, player_ids)
                self._upsert_event_scores(event_id, list(totals.keys()), totals)
                last_round_pairs = build_last_round_opponent_pairs(current_matches)
                plan = self.team_mexicano_service.generate_next_round(
                    current_round.round_number,
                    fixed_teams,
                    courts,
                    previous_scores=totals,
                    last_round_opponent_pairs=last_round_pairs,
                )
            else:
                ordered_players, totals = self._rank_players_for_mexicano(event_id, player_ids)
                self._upsert_event_scores(event_id, ordered_players, totals)
                plan = self.mexicano_service.generate_next_round(
                    current_round.round_number,
                    ordered_players,
                    courts,
                    previous_matches=current_matches,
                    partner_history=partner_history,
                    event_seed=event_seed,
                )
        else:
            plan = self.rb_service.generate_next_round(
                current_round.round_number,
                player_ids,
                courts,
                previous_matches=current_matches,
                partner_history=partner_history,
                event_seed=event_seed,
            )

        round_id = str(uuid4())
        self.rounds_repo.create_round(round_id, event_id, plan.round_number, RoundStatus.RUNNING)
        self.matches_repo.create_matches_bulk(
            event_id, round_id, [(str(uuid4()), m) for m in plan.matches]
        )
        self.events_repo.set_status(event_id, event.status, plan.round_number)
        return self.get_current_round_view(event_id)

    def _build_previous_partner_map(self, matches: list) -> dict[str, str]:
        partner_by_player: dict[str, str] = {}
        for match in matches:
            p11, p12 = match.team1_player1_id, match.team1_player2_id
            p21, p22 = match.team2_player1_id, match.team2_player2_id
            partner_by_player[p11] = p12
            partner_by_player[p12] = p11
            partner_by_player[p21] = p22
            partner_by_player[p22] = p21
        return partner_by_player

    def _score_deltas_for_match(self, match) -> dict[str, int]:
        deltas: dict[str, int] = defaultdict(int)
        if match.result_type.value == "Score24":
            value1 = match.team1_score or 0
            value2 = match.team2_score or 0
            deltas[match.team1_player1_id] += value1
            deltas[match.team1_player2_id] += value1
            deltas[match.team2_player1_id] += value2
            deltas[match.team2_player2_id] += value2
            return deltas

        if match.result_type.value == "WinLossDraw":
            if match.is_draw:
                delta1 = delta2 = 5
            elif match.winner_team == 1:
                delta1, delta2 = 25, -15
            else:
                delta1, delta2 = -15, 25
            deltas[match.team1_player1_id] += delta1
            deltas[match.team1_player2_id] += delta1
            deltas[match.team2_player1_id] += delta2
            deltas[match.team2_player2_id] += delta2
            return deltas

        if match.winner_team == 1:
            deltas[match.team1_player1_id] += 1
            deltas[match.team1_player2_id] += 1
        elif match.winner_team == 2:
            deltas[match.team2_player1_id] += 1
            deltas[match.team2_player2_id] += 1
        return deltas

    def _calculate_player_totals(self, event_id: str, player_ids: list[str]) -> dict[str, int]:
        totals: dict[str, int] = {player_id: 0 for player_id in player_ids}
        for round_obj in self.rounds_repo.list_rounds(event_id):
            for match in self.matches_repo.list_by_round(round_obj.id):
                for player_id, delta in self._score_deltas_for_match(match).items():
                    totals[player_id] = totals.get(player_id, 0) + delta
        return totals

    def _rank_players_for_mexicano(
        self, event_id: str, player_ids: list[str]
    ) -> tuple[list[str], dict[str, int]]:
        totals = self._calculate_player_totals(event_id, player_ids)
        previous_scores = self.rankings_repo.list_event_scores(event_id)
        previous_rank = {
            row[1]: row[3] if row[3] is not None else 10_000 for row in previous_scores
        }
        seed_order = {player_id: index + 1 for index, player_id in enumerate(player_ids)}

        ordered = sorted(
            player_ids,
            key=lambda player_id: (
                -totals.get(player_id, 0),
                previous_rank.get(player_id, seed_order[player_id]),
                player_id,
            ),
        )
        return ordered, totals

    def _upsert_event_scores(
        self, event_id: str, ordered_players: list[str], totals: dict[str, int]
    ) -> None:
        for rank_position, player_id in enumerate(ordered_players, start=1):
            self.rankings_repo.upsert_event_score(
                str(uuid4()),
                event_id,
                player_id,
                totals.get(player_id, 0),
                rank_position,
            )

    def summarize(self, event_id: str) -> dict:
        rounds = self.rounds_repo.list_rounds(event_id)
        all_matches = []
        player_ids = self.events_repo.list_player_ids(event_id)
        player_totals: dict[str, int] = {player_id: 0 for player_id in player_ids}
        for round_obj in rounds:
            matches = self.matches_repo.list_by_round(round_obj.id)
            all_matches.extend(matches)
            for match in matches:
                for player_id, delta in self._score_deltas_for_match(match).items():
                    player_totals[player_id] = player_totals.get(player_id, 0) + delta

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

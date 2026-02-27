from app.domain.enums import EventStatus, EventType, MatchStatus, ResultType
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.players_repo import PlayersRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.name_format import format_display_name
from app.services.summary_ordering import SummaryOrderingService
from app.services.round_service import RoundService


class SummaryService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
        players_repo: PlayersRepository,
        round_service: RoundService,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.players_repo = players_repo
        self.round_service = round_service
        self.summary_ordering = SummaryOrderingService()

    def is_final_summary_available(self, event_id: str) -> bool:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        return (
            event.current_round_number is not None
            and event.current_round_number >= event.round_count
        )

    def finish_event(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        if event.current_round_number is None or event.current_round_number < event.round_count:
            raise ValueError("Event can only be finished after final round")

        summary = self.round_service.summarize(event_id)
        self.events_repo.set_status(event_id, EventStatus.FINISHED, event.current_round_number)
        return summary

    def get_final_summary(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        if not self.is_final_summary_available(event_id):
            raise ValueError("Event can only be summarized after final round")
        return self.round_service.summarize(event_id)

    def crowned_player_ids(self, event_id: str, summary: dict) -> list[str]:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        if event.event_type == EventType.MEXICANO:
            return self._crowned_players_for_mexicano(summary.get("standings", []))
        if event.event_type == EventType.AMERICANO:
            return self._crowned_players_for_americano(summary)
        return []

    def build_final_round_matrix(self, event_id: str, summary: dict) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        standings = summary.get("standings", [])
        rounds = self.rounds_repo.list_rounds(event_id)
        columns = [
            {"id": f"round-{round_obj.round_number}", "label": f"R{round_obj.round_number}"}
            for round_obj in rounds
        ]
        columns.append({"id": "total", "label": "Total"})

        totals_by_player = {row[1]: row[2] for row in standings}
        player_rows = []
        for player_id in self.events_repo.list_player_ids(event_id):
            player = self.players_repo.get(player_id)
            display_name = format_display_name(player.display_name) if player else player_id

            cells = []
            for round_obj in rounds:
                value = "0"
                for match in self.matches_repo.list_by_round(round_obj.id):
                    if player_id in {
                        match.team1_player1_id,
                        match.team1_player2_id,
                        match.team2_player1_id,
                        match.team2_player2_id,
                    }:
                        value = str(self._match_numeric_value_for_player(match, player_id))
                        break
                cells.append({"columnId": f"round-{round_obj.round_number}", "value": value})

            cells.append({"columnId": "total", "value": str(totals_by_player.get(player_id, 0))})
            player_rows.append({"playerId": player_id, "displayName": display_name, "cells": cells})

        global_scores: dict[str, int] = {}
        for player_id in self.events_repo.list_player_ids(event_id):
            player = self.players_repo.get(player_id)
            global_scores[player_id] = player.global_ranking_score if player else 0

        ordered_rows, ordering_metadata = self.summary_ordering.order_final_rows(
            event.event_type,
            player_rows,
            totals_by_player,
            summary.get("rounds", []),
            summary.get("matches", []),
            self.events_repo.list_courts(event_id),
            global_scores,
        )

        return {
            "columns": columns,
            "player_rows": ordered_rows,
            "ordering_mode": ordering_metadata.ordering_mode,
            "ordering_version": ordering_metadata.ordering_version,
        }

    def build_final_match_matrix(self, event_id: str, summary: dict) -> dict:
        # Backward-compatible alias retained for existing callers/tests.
        return self.build_final_round_matrix(event_id, summary)

    def get_progress_summary(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        player_ids = self.events_repo.list_player_ids(event_id)
        rounds = self.rounds_repo.list_rounds(event_id)
        columns = [
            {"id": f"round-{round_obj.round_number}", "label": f"R{round_obj.round_number}"}
            for round_obj in rounds
        ]
        columns.append({"id": "total", "label": "Total"})

        totals_by_player: dict[str, int] = {player_id: 0 for player_id in player_ids}
        player_rows = []
        for player_id in player_ids:
            player = self.players_repo.get(player_id)
            display_name = format_display_name(player.display_name) if player else player_id
            cells = []
            for round_obj in rounds:
                matches = self.matches_repo.list_by_round(round_obj.id)
                value = "-"
                for match in matches:
                    if player_id in {
                        match.team1_player1_id,
                        match.team1_player2_id,
                        match.team2_player1_id,
                        match.team2_player2_id,
                    }:
                        value = self._match_value_for_player(match, player_id)
                        totals_by_player[player_id] += self._match_numeric_value_for_player(
                            match, player_id
                        )
                        break
                cells.append({"columnId": f"round-{round_obj.round_number}", "value": value})

            cells.append({"columnId": "total", "value": str(totals_by_player.get(player_id, 0))})

            player_rows.append(
                {
                    "playerId": player_id,
                    "displayName": display_name,
                    "cells": cells,
                }
            )

        ordered_rows, ordering_metadata = self.summary_ordering.order_progress_rows(
            player_rows,
            totals_by_player,
        )

        return {
            "event_id": event_id,
            "columns": columns,
            "player_rows": ordered_rows,
            "ordering_mode": ordering_metadata.ordering_mode,
            "ordering_version": ordering_metadata.ordering_version,
        }

    def _match_value_for_player(self, match, player_id: str) -> str:
        if match.status != MatchStatus.COMPLETED:
            return "-"

        player_team = self._player_team(match, player_id)
        if player_team is None:
            return "-"

        if match.result_type == ResultType.SCORE_24:
            score = match.team1_score if player_team == 1 else match.team2_score
            return str(score) if score is not None else "-"

        if match.result_type == ResultType.WIN_LOSS_DRAW:
            if match.is_draw:
                return "D"
            return "W" if match.winner_team == player_team else "L"

        if match.winner_team is None:
            return "-"
        return "W" if match.winner_team == player_team else "L"

    def _match_numeric_value_for_player(self, match, player_id: str) -> int:
        if match.status != MatchStatus.COMPLETED:
            return 0

        player_team = self._player_team(match, player_id)
        if player_team is None:
            return 0

        if match.result_type == ResultType.SCORE_24:
            return int(match.team1_score or 0) if player_team == 1 else int(match.team2_score or 0)

        if match.result_type == ResultType.WIN_LOSS_DRAW:
            if match.is_draw:
                return 5
            if match.winner_team == player_team:
                return 25
            return -15

        if match.winner_team is None:
            return 0
        return 1 if match.winner_team == player_team else 0

    def _player_team(self, match, player_id: str) -> int | None:
        if player_id in {match.team1_player1_id, match.team1_player2_id}:
            return 1
        if player_id in {match.team2_player1_id, match.team2_player2_id}:
            return 2
        return None

    def _crowned_players_for_mexicano(self, standings: list[tuple]) -> list[str]:
        if not standings:
            return []

        top_score = standings[0][2]
        crowned = [row[1] for row in standings if row[2] == top_score]
        return crowned

    def _crowned_players_for_americano(self, summary: dict) -> list[str]:
        rounds = summary.get("rounds", [])
        if not rounds:
            return []

        final_round_number = max(round_obj.round_number for round_obj in rounds)
        final_round_ids = {
            round_obj.id for round_obj in rounds if round_obj.round_number == final_round_number
        }
        if not final_round_ids:
            return []

        final_round_matches = [
            match for match in summary.get("matches", []) if match.round_id in final_round_ids
        ]
        if not final_round_matches:
            return []

        highest_court_match = max(final_round_matches, key=lambda match: match.court_number)
        if highest_court_match.winner_team == 1:
            return [
                highest_court_match.team1_player1_id,
                highest_court_match.team1_player2_id,
            ]
        if highest_court_match.winner_team == 2:
            return [
                highest_court_match.team2_player1_id,
                highest_court_match.team2_player2_id,
            ]
        return []

from app.domain.enums import EventStatus, MatchStatus, ResultType
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.players_repo import PlayersRepository
from app.repositories.rounds_repo import RoundsRepository
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

    def build_final_match_matrix(self, event_id: str, standings: list[tuple]) -> dict:
        rounds = self.rounds_repo.list_rounds(event_id)
        all_matches = []
        for round_obj in rounds:
            all_matches.extend(self.matches_repo.list_by_round(round_obj.id))

        columns = [
            {"id": f"match-{index}", "label": f"M{index}"}
            for index, _ in enumerate(all_matches, start=1)
        ]
        columns.append({"id": "total", "label": "Total"})

        totals_by_player = {row[1]: row[2] for row in standings}
        player_rows = []
        for player_id in self.events_repo.list_player_ids(event_id):
            player = self.players_repo.get(player_id)
            display_name = player.display_name if player else player_id

            cells = []
            for index, match in enumerate(all_matches, start=1):
                value = "-"
                if player_id in {
                    match.team1_player1_id,
                    match.team1_player2_id,
                    match.team2_player1_id,
                    match.team2_player2_id,
                }:
                    value = self._match_value_for_player(match, player_id)
                cells.append({"columnId": f"match-{index}", "value": value})

            cells.append({"columnId": "total", "value": str(totals_by_player.get(player_id, 0))})
            player_rows.append({"playerId": player_id, "displayName": display_name, "cells": cells})

        return {"columns": columns, "player_rows": player_rows}

    def get_progress_summary(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        player_ids = self.events_repo.list_player_ids(event_id)
        rounds = self.rounds_repo.list_rounds(event_id)
        columns = [
            {"id": f"round-{round_obj.round_number}", "label": f"Round {round_obj.round_number}"}
            for round_obj in rounds
        ]

        player_rows = []
        for player_id in player_ids:
            player = self.players_repo.get(player_id)
            display_name = player.display_name if player else player_id
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
                        break
                cells.append({"columnId": f"round-{round_obj.round_number}", "value": value})

            player_rows.append(
                {
                    "playerId": player_id,
                    "displayName": display_name,
                    "cells": cells,
                }
            )

        return {
            "event_id": event_id,
            "columns": columns,
            "player_rows": player_rows,
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

    def _player_team(self, match, player_id: str) -> int | None:
        if player_id in {match.team1_player1_id, match.team1_player2_id}:
            return 1
        if player_id in {match.team2_player1_id, match.team2_player2_id}:
            return 2
        return None

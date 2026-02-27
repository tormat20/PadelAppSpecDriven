from __future__ import annotations

from dataclasses import dataclass

from app.domain.enums import EventType


ORDERING_VERSION = "v1"


@dataclass(slots=True)
class SummaryOrderingMetadata:
    ordering_mode: str
    ordering_version: str = ORDERING_VERSION


class SummaryOrderingService:
    def order_progress_rows(
        self,
        rows: list[dict],
        totals_by_player: dict[str, int],
    ) -> tuple[list[dict], SummaryOrderingMetadata]:
        ordered = sorted(
            rows,
            key=lambda row: (
                -totals_by_player.get(row["playerId"], 0),
                row["displayName"].lower(),
                row["playerId"],
            ),
        )
        ranked = self._assign_competition_rank(ordered, totals_by_player)
        return ranked, SummaryOrderingMetadata(ordering_mode="progress-score-desc")

    def order_final_rows(
        self,
        event_type: EventType,
        rows: list[dict],
        totals_by_player: dict[str, int],
        rounds: list,
        matches: list,
        courts: list[int],
        global_scores: dict[str, int],
    ) -> tuple[list[dict], SummaryOrderingMetadata]:
        if event_type == EventType.MEXICANO:
            ordered = sorted(
                rows,
                key=lambda row: (
                    -totals_by_player.get(row["playerId"], 0),
                    row["displayName"].lower(),
                    row["playerId"],
                ),
            )
            ranked = self._assign_competition_rank(ordered, totals_by_player)
            return ranked, SummaryOrderingMetadata(ordering_mode="final-mexicano-total-desc")

        if event_type == EventType.AMERICANO:
            ordered = self._order_americano_final(rows, rounds, matches)
            ranked = self._assign_sequential_rank(ordered)
            return ranked, SummaryOrderingMetadata(ordering_mode="final-americano-court-priority")

        ordered = self._order_btb_final(rows, totals_by_player, courts, global_scores)
        ranked = self._assign_sequential_rank(ordered)
        return ranked, SummaryOrderingMetadata(ordering_mode="final-btb-global-court-groups")

    def _order_americano_final(self, rows: list[dict], rounds: list, matches: list) -> list[dict]:
        if not rows:
            return []

        rows_by_id = {row["playerId"]: row for row in rows}
        final_round_number = max((round_obj.round_number for round_obj in rounds), default=0)
        final_round_ids = {
            round_obj.id for round_obj in rounds if round_obj.round_number == final_round_number
        }

        final_round_matches = [match for match in matches if match.round_id in final_round_ids]
        ordered_ids: list[str] = []

        for match in sorted(
            final_round_matches, key=lambda current: current.court_number, reverse=True
        ):
            if match.winner_team == 1:
                winners = [match.team1_player1_id, match.team1_player2_id]
                losers = [match.team2_player1_id, match.team2_player2_id]
            elif match.winner_team == 2:
                winners = [match.team2_player1_id, match.team2_player2_id]
                losers = [match.team1_player1_id, match.team1_player2_id]
            else:
                winners = [match.team1_player1_id, match.team1_player2_id]
                losers = [match.team2_player1_id, match.team2_player2_id]

            winners = self._sort_player_ids_by_name(winners, rows_by_id)
            losers = self._sort_player_ids_by_name(losers, rows_by_id)
            ordered_ids.extend(winners)
            ordered_ids.extend(losers)

        remaining_ids = [row["playerId"] for row in rows if row["playerId"] not in ordered_ids]
        remaining_ids = self._sort_player_ids_by_name(remaining_ids, rows_by_id)
        ordered_ids.extend(remaining_ids)
        return [rows_by_id[player_id] for player_id in ordered_ids if player_id in rows_by_id]

    def _order_btb_final(
        self,
        rows: list[dict],
        totals_by_player: dict[str, int],
        courts: list[int],
        global_scores: dict[str, int],
    ) -> list[dict]:
        rows_by_id = {row["playerId"]: row for row in rows}
        ordered_by_global = sorted(
            rows,
            key=lambda row: (
                -global_scores.get(row["playerId"], 0),
                row["displayName"].lower(),
                row["playerId"],
            ),
        )

        group_size = 4
        group_count = max(1, len(courts))
        grouped_ids: list[list[str]] = []
        for group_index in range(group_count):
            start = group_index * group_size
            end = start + group_size
            grouped_ids.append([row["playerId"] for row in ordered_by_global[start:end]])

        grouped_rows: list[dict] = []
        for group in grouped_ids:
            if not group:
                continue
            ordered_group = sorted(
                [rows_by_id[player_id] for player_id in group if player_id in rows_by_id],
                key=lambda row: (
                    -totals_by_player.get(row["playerId"], 0),
                    row["displayName"].lower(),
                    row["playerId"],
                ),
            )
            grouped_rows.extend(ordered_group)

        seen = {row["playerId"] for row in grouped_rows}
        for row in sorted(
            rows,
            key=lambda current: (
                -totals_by_player.get(current["playerId"], 0),
                current["displayName"].lower(),
                current["playerId"],
            ),
        ):
            if row["playerId"] not in seen:
                grouped_rows.append(row)
        return grouped_rows

    def _assign_competition_rank(
        self,
        rows: list[dict],
        totals_by_player: dict[str, int],
    ) -> list[dict]:
        ranked: list[dict] = []
        previous_total: int | None = None
        previous_rank = 0

        for index, row in enumerate(rows, start=1):
            total = totals_by_player.get(row["playerId"], 0)
            if previous_total is None or total != previous_total:
                current_rank = index
                previous_rank = current_rank
                previous_total = total
            else:
                current_rank = previous_rank

            ranked_row = dict(row)
            ranked_row["rank"] = current_rank
            ranked.append(ranked_row)

        return ranked

    def _assign_sequential_rank(self, rows: list[dict]) -> list[dict]:
        ranked: list[dict] = []
        for index, row in enumerate(rows, start=1):
            ranked_row = dict(row)
            ranked_row["rank"] = index
            ranked.append(ranked_row)
        return ranked

    def _sort_player_ids_by_name(
        self, player_ids: list[str], rows_by_id: dict[str, dict]
    ) -> list[str]:
        return sorted(
            player_ids,
            key=lambda player_id: (
                rows_by_id.get(player_id, {}).get("displayName", "").lower(),
                player_id,
            ),
        )

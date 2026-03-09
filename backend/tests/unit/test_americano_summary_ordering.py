"""Unit tests for Americano final summary ordering (FR-001, FR-002)."""

import pytest

from app.domain.enums import EventType
from app.services.summary_ordering import SummaryOrderingService


def _make_rows(scores: list[tuple[str, int]]) -> tuple[list[dict], dict[str, int]]:
    """Build player rows and totals_by_player from (name, score) pairs."""
    rows = [
        {
            "playerId": f"p-{name}",
            "displayName": name,
            "cells": [{"columnId": "total", "value": str(score)}],
        }
        for name, score in scores
    ]
    totals = {f"p-{name}": score for name, score in scores}
    return rows, totals


class TestAmericanoFinalOrdering:
    def setup_method(self):
        self.service = SummaryOrderingService()

    def _order(self, scores: list[tuple[str, int]]) -> list[dict]:
        rows, totals = _make_rows(scores)
        ordered, _ = self.service.order_final_rows(
            EventType.AMERICANO,
            rows,
            totals,
            rounds=[],
            matches=[],
            courts=[1, 2],
            global_scores={},
        )
        return ordered

    def test_ordering_mode_label(self):
        rows, totals = _make_rows([("Alice", 30), ("Bob", 20)])
        _, metadata = self.service.order_final_rows(
            EventType.AMERICANO,
            rows,
            totals,
            rounds=[],
            matches=[],
            courts=[1, 2],
            global_scores={},
        )
        assert metadata.ordering_mode == "final-americano-total-desc"

    def test_sorted_descending_by_total_score(self):
        ordered = self._order([("Alice", 30), ("Bob", 50), ("Carol", 10), ("Dave", 40)])
        names = [r["displayName"] for r in ordered]
        assert names == ["Bob", "Dave", "Alice", "Carol"]

    def test_rank_1_assigned_to_highest_score(self):
        ordered = self._order([("Alice", 30), ("Bob", 50), ("Carol", 10)])
        assert ordered[0]["rank"] == 1
        assert ordered[0]["displayName"] == "Bob"

    def test_tied_players_share_rank(self):
        ordered = self._order([("Alice", 40), ("Bob", 40), ("Carol", 20)])
        ranks = {r["displayName"]: r["rank"] for r in ordered}
        assert ranks["Alice"] == 1
        assert ranks["Bob"] == 1
        assert ranks["Carol"] == 3  # skips rank 2

    def test_alphabetical_tiebreak_within_same_score(self):
        ordered = self._order([("Zara", 50), ("Anna", 50)])
        names = [r["displayName"] for r in ordered]
        assert names == ["Anna", "Zara"]

    def test_all_players_have_rank(self):
        ordered = self._order([("Alice", 30), ("Bob", 20), ("Carol", 10), ("Dave", 5)])
        for row in ordered:
            assert "rank" in row
            assert isinstance(row["rank"], int)

    def test_single_player_gets_rank_1(self):
        ordered = self._order([("Alice", 42)])
        assert ordered[0]["rank"] == 1

    def test_empty_rows_returns_empty(self):
        ordered = self._order([])
        assert ordered == []

    def test_does_not_use_rb_global_court_ordering(self):
        # With distinct scores, the order must be purely score-descending
        # (RB ordering would use global scores / court groups instead).
        ordered = self._order(
            [
                ("P1", 100),
                ("P2", 200),
                ("P3", 150),
                ("P4", 50),
            ]
        )
        scores = [r["cells"][0]["value"] for r in ordered]
        assert scores == ["200", "150", "100", "50"]

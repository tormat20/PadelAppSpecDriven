import { describe, expect, it } from "vitest"

import { getPodiumSlots } from "../src/pages/Summary"
import type { ProgressSummaryPlayerRow } from "../src/lib/types"

function makeRow(
  rank: number,
  displayName: string,
  total = 0,
): ProgressSummaryPlayerRow {
  return {
    rank,
    playerId: `p${rank}-${displayName}`,
    displayName,
    cells: [{ columnId: "total", value: String(total) }],
  }
}

describe("getPodiumSlots", () => {
  // ── RankedBox ─────────────────────────────────────────────────────────────

  describe("RankedBox", () => {
    it("returns empty array regardless of player count", () => {
      expect(getPodiumSlots("RankedBox", [])).toEqual([])
      expect(
        getPodiumSlots("RankedBox", [makeRow(1, "Alice"), makeRow(2, "Bob")]),
      ).toEqual([])
    })
  })

  // ── Mexicano ──────────────────────────────────────────────────────────────

  describe("Mexicano", () => {
    it("returns 3 slots in visual order [2nd, 1st, 3rd] for full field", () => {
      const rows = [
        makeRow(1, "Alice", 30),
        makeRow(2, "Bob", 20),
        makeRow(3, "Carol", 10),
        makeRow(4, "Dave", 5),
      ]
      const slots = getPodiumSlots("Mexicano", rows)
      expect(slots).toHaveLength(3)
      // visual order: 2nd, 1st, 3rd
      expect(slots[0].rank).toBe(1)   // 2nd place
      expect(slots[1].rank).toBe(0)   // 1st place
      expect(slots[2].rank).toBe(2)   // 3rd place
    })

    it("each slot has exactly 1 player", () => {
      const rows = [makeRow(1, "Alice", 30), makeRow(2, "Bob", 20), makeRow(3, "Carol", 10)]
      const slots = getPodiumSlots("Mexicano", rows)
      expect(slots[0].playerNames).toEqual(["Bob"])
      expect(slots[1].playerNames).toEqual(["Alice"])
      expect(slots[2].playerNames).toEqual(["Carol"])
    })

    it("carries correct score for each slot", () => {
      const rows = [makeRow(1, "Alice", 42), makeRow(2, "Bob", 28), makeRow(3, "Carol", 15)]
      const slots = getPodiumSlots("Mexicano", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      const slot2nd = slots.find((s) => s.rank === 1)!
      const slot3rd = slots.find((s) => s.rank === 2)!
      expect(slot1st.score).toBe(42)
      expect(slot2nd.score).toBe(28)
      expect(slot3rd.score).toBe(15)
    })

    it("returns only available slots when fewer than 3 players", () => {
      const rows = [makeRow(1, "Alice", 30), makeRow(2, "Bob", 20)]
      const slots = getPodiumSlots("Mexicano", rows)
      // Only 1st and 2nd — visual order is [2nd, 1st]
      expect(slots).toHaveLength(2)
      const ranks = slots.map((s) => s.rank)
      expect(ranks).toContain(0)
      expect(ranks).toContain(1)
    })

    it("returns empty array with no players", () => {
      expect(getPodiumSlots("Mexicano", [])).toEqual([])
    })

    it("stores correct playerIds for crown lookup", () => {
      const rows = [makeRow(1, "Alice", 10), makeRow(2, "Bob", 8), makeRow(3, "Carol", 6)]
      const slots = getPodiumSlots("Mexicano", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      expect(slot1st.playerIds).toEqual(["p1-Alice"])
    })
  })

  // ── Americano (same podium logic as Mexicano) ─────────────────────────────

  describe("Americano", () => {
    it("returns 3 slots in visual order [2nd, 1st, 3rd] for full field", () => {
      const rows = [
        makeRow(1, "Alice", 30),
        makeRow(2, "Bob", 20),
        makeRow(3, "Carol", 10),
        makeRow(4, "Dave", 5),
      ]
      const slots = getPodiumSlots("Americano", rows)
      expect(slots).toHaveLength(3)
      expect(slots[0].rank).toBe(1)   // 2nd place (visual left)
      expect(slots[1].rank).toBe(0)   // 1st place (visual centre)
      expect(slots[2].rank).toBe(2)   // 3rd place (visual right)
    })

    it("each slot has exactly 1 player", () => {
      const rows = [makeRow(1, "Alice", 30), makeRow(2, "Bob", 20), makeRow(3, "Carol", 10)]
      const slots = getPodiumSlots("Americano", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      expect(slot1st.playerNames).toEqual(["Alice"])
    })

    it("1st-place slot carries the highest score", () => {
      const rows = [makeRow(1, "Alice", 42), makeRow(2, "Bob", 28), makeRow(3, "Carol", 15)]
      const slots = getPodiumSlots("Americano", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      expect(slot1st.score).toBe(42)
    })

    it("returns empty array with no players", () => {
      expect(getPodiumSlots("Americano", [])).toEqual([])
    })

    it("stores correct playerIds for crown lookup", () => {
      const rows = [makeRow(1, "Alice", 10), makeRow(2, "Bob", 8), makeRow(3, "Carol", 6)]
      const slots = getPodiumSlots("Americano", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      expect(slot1st.playerIds).toEqual(["p1-Alice"])
    })
  })

  // ── WinnersCourt ──────────────────────────────────────────────────────────

  describe("WinnersCourt", () => {
    it("pairs ranks 1-2 into 1st slot, 3-4 into 2nd, 5-6 into 3rd", () => {
      const rows = [
        makeRow(1, "A", 50), makeRow(2, "B", 48),
        makeRow(3, "C", 30), makeRow(4, "D", 28),
        makeRow(5, "E", 10), makeRow(6, "F", 8),
      ]
      const slots = getPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(3)
      const slot1st = slots.find((s) => s.rank === 0)!
      const slot2nd = slots.find((s) => s.rank === 1)!
      const slot3rd = slots.find((s) => s.rank === 2)!
      expect(slot1st.playerNames).toEqual(["A", "B"])
      expect(slot2nd.playerNames).toEqual(["C", "D"])
      expect(slot3rd.playerNames).toEqual(["E", "F"])
    })

    it("returns visual order [2nd, 1st, 3rd]", () => {
      const rows = [
        makeRow(1, "A", 50), makeRow(2, "B", 48),
        makeRow(3, "C", 30), makeRow(4, "D", 28),
        makeRow(5, "E", 10), makeRow(6, "F", 8),
      ]
      const slots = getPodiumSlots("WinnersCourt", rows)
      expect(slots[0].rank).toBe(1)
      expect(slots[1].rank).toBe(0)
      expect(slots[2].rank).toBe(2)
    })

    it("uses the top player's score for each slot", () => {
      const rows = [
        makeRow(1, "A", 50), makeRow(2, "B", 48),
        makeRow(3, "C", 30), makeRow(4, "D", 28),
      ]
      const slots = getPodiumSlots("WinnersCourt", rows)
      const slot1st = slots.find((s) => s.rank === 0)!
      const slot2nd = slots.find((s) => s.rank === 1)!
      expect(slot1st.score).toBe(50)
      expect(slot2nd.score).toBe(30)
    })

    it("only shows 1st slot when only 2 players available", () => {
      const rows = [makeRow(1, "Alice", 20), makeRow(2, "Bob", 18)]
      const slots = getPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(1)
      expect(slots[0].rank).toBe(0)
      expect(slots[0].playerNames).toEqual(["Alice", "Bob"])
    })

    it("handles partial slots gracefully", () => {
      const rows = [
        makeRow(1, "A", 50), makeRow(2, "B", 48),
        makeRow(3, "C", 30),
      ]
      const slots = getPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(2)
      const slot2nd = slots.find((s) => s.rank === 1)!
      expect(slot2nd.playerNames).toEqual(["C"])
    })

    it("returns empty array with no players", () => {
      expect(getPodiumSlots("WinnersCourt", [])).toEqual([])
    })
  })
})

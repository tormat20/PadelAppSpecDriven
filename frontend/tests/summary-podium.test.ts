import { describe, expect, it } from "vitest"

import { buildPodiumSlots } from "../src/features/summary/podium"
import type { ProgressSummaryPlayerRow } from "../src/lib/types"

function makeRow(rank: number, displayName: string): ProgressSummaryPlayerRow {
  return { rank, playerId: `p${rank}`, displayName, cells: [] }
}

describe("buildPodiumSlots", () => {
  describe("BeatTheBox", () => {
    it("returns empty array", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob"), makeRow(3, "Carol")]
      expect(buildPodiumSlots("BeatTheBox", rows)).toEqual([])
    })

    it("returns empty array even with no players", () => {
      expect(buildPodiumSlots("BeatTheBox", [])).toEqual([])
    })
  })

  describe("Mexicano", () => {
    it("returns 3 slots with 1 player each for full field", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob"), makeRow(3, "Carol"), makeRow(4, "Dave")]
      const slots = buildPodiumSlots("Mexicano", rows)
      expect(slots).toHaveLength(3)
      expect(slots[0]).toMatchObject({ place: 1, players: ["Alice"] })
      expect(slots[1]).toMatchObject({ place: 2, players: ["Bob"] })
      expect(slots[2]).toMatchObject({ place: 3, players: ["Carol"] })
    })

    it("assigns correct height classes", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob"), makeRow(3, "Carol")]
      const slots = buildPodiumSlots("Mexicano", rows)
      expect(slots.find((s) => s.place === 1)?.heightClass).toBe("podium-slot--first")
      expect(slots.find((s) => s.place === 2)?.heightClass).toBe("podium-slot--second")
      expect(slots.find((s) => s.place === 3)?.heightClass).toBe("podium-slot--third")
    })

    it("assigns correct place labels", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob"), makeRow(3, "Carol")]
      const slots = buildPodiumSlots("Mexicano", rows)
      expect(slots.find((s) => s.place === 1)?.label).toBe("1st")
      expect(slots.find((s) => s.place === 2)?.label).toBe("2nd")
      expect(slots.find((s) => s.place === 3)?.label).toBe("3rd")
    })

    it("only shows filled positions when fewer than 3 players", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob")]
      const slots = buildPodiumSlots("Mexicano", rows)
      expect(slots).toHaveLength(2)
      expect(slots.map((s) => s.place)).toEqual([1, 2])
    })

    it("returns empty array with no players", () => {
      expect(buildPodiumSlots("Mexicano", [])).toEqual([])
    })
  })

  describe("WinnersCourt", () => {
    it("returns 3 slots with 2 players each for full 6-player field", () => {
      const rows = [
        makeRow(1, "Alice"),
        makeRow(2, "Bob"),
        makeRow(3, "Carol"),
        makeRow(4, "Dave"),
        makeRow(5, "Eve"),
        makeRow(6, "Frank"),
      ]
      const slots = buildPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(3)
      expect(slots[0]).toMatchObject({ place: 1, players: ["Alice", "Bob"] })
      expect(slots[1]).toMatchObject({ place: 2, players: ["Carol", "Dave"] })
      expect(slots[2]).toMatchObject({ place: 3, players: ["Eve", "Frank"] })
    })

    it("only shows 1st slot when only 2 players available", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob")]
      const slots = buildPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(1)
      expect(slots[0]).toMatchObject({ place: 1, players: ["Alice", "Bob"] })
    })

    it("packs ranks 1-2 into 1st, 3-4 into 2nd, 5-6 into 3rd", () => {
      const rows = [
        makeRow(1, "P1"),
        makeRow(2, "P2"),
        makeRow(3, "P3"),
        makeRow(4, "P4"),
        makeRow(5, "P5"),
        makeRow(6, "P6"),
      ]
      const slots = buildPodiumSlots("WinnersCourt", rows)
      expect(slots[0].players).toEqual(["P1", "P2"])
      expect(slots[1].players).toEqual(["P3", "P4"])
      expect(slots[2].players).toEqual(["P5", "P6"])
    })

    it("returns only filled slots when field is sparse", () => {
      const rows = [makeRow(1, "Alice"), makeRow(2, "Bob"), makeRow(3, "Carol")]
      const slots = buildPodiumSlots("WinnersCourt", rows)
      expect(slots).toHaveLength(2)
      expect(slots[0]).toMatchObject({ place: 1, players: ["Alice", "Bob"] })
      expect(slots[1]).toMatchObject({ place: 2, players: ["Carol"] })
    })
  })
})

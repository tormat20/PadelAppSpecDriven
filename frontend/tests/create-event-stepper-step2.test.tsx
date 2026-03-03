import { describe, expect, it } from "vitest"

import {
  getRequiredPlayerCount,
  isCreateEventDisabled,
} from "../src/features/create-event/validation"

describe("Create Event Stepper — Step 2 (Roster)", () => {
  // ─── Player count derived from courts ─────────────────────────────────────

  describe("required player count from courts", () => {
    it("is 0 when no courts are selected", () => {
      expect(getRequiredPlayerCount([])).toBe(0)
    })

    it("is 4 for a single court", () => {
      expect(getRequiredPlayerCount([1])).toBe(4)
    })

    it("is 8 for two courts", () => {
      expect(getRequiredPlayerCount([1, 2])).toBe(8)
    })

    it("is 12 for three courts", () => {
      expect(getRequiredPlayerCount([1, 2, 3])).toBe(12)
    })
  })

  // ─── Step 1 Next is always enabled ────────────────────────────────────────
  // The Step 1 (Roster) Next button has no blocking validation — courts and
  // players are optional for the PATCH. The backend will set lifecycleStatus
  // to "planned" or "ready" depending on completeness.

  describe("Step 1 Next enabled regardless of roster completeness", () => {
    it("slot can be saved with zero courts and zero players", () => {
      // isCreateEventDisabled with empty courts/players returns false when name+date are set —
      // confirming we do not block the Next action on Step 1.
      expect(
        isCreateEventDisabled({
          eventName: "Thursday Ladder",
          eventDate: "2026-05-01",
          courts: [],
          playerIds: [],
        }),
      ).toBe(false)
    })

    it("slot can be saved with partial player list", () => {
      expect(
        isCreateEventDisabled({
          eventName: "Thursday Ladder",
          eventDate: "2026-05-01",
          courts: [1],
          playerIds: ["p1", "p2"],
        }),
      ).toBe(false)
    })
  })

  // ─── Player count progress display ────────────────────────────────────────

  describe("player count progress display calculation", () => {
    it("shows 0/0 when no courts and no players", () => {
      const courts: number[] = []
      const assigned = 0
      const required = getRequiredPlayerCount(courts)
      expect(`${assigned} / ${required} players assigned`).toBe("0 / 0 players assigned")
    })

    it("shows correct fraction when partially filled", () => {
      const courts = [1, 2]
      const assigned = 3
      const required = getRequiredPlayerCount(courts)
      expect(`${assigned} / ${required} players assigned`).toBe("3 / 8 players assigned")
    })

    it("shows full count when roster is complete", () => {
      const courts = [1]
      const assigned = 4
      const required = getRequiredPlayerCount(courts)
      expect(`${assigned} / ${required} players assigned`).toBe("4 / 4 players assigned")
    })
  })
})

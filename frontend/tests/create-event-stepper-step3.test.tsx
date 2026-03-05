import { describe, expect, it } from "vitest"

import {
  getRequiredPlayerCount,
  isStrictCreateEventDisabled,
} from "../src/features/create-event/validation"
import { getEventModeLabel } from "../src/lib/eventMode"

describe("Create Event Stepper — Step 3 (Confirm)", () => {
  // ─── Summary field display values ─────────────────────────────────────────

  describe("summary field display values", () => {
    it("shows mode label for WinnersCourt", () => {
      expect(getEventModeLabel("WinnersCourt")).toBe("Winners Court")
    })

    it("shows mode label for Mexicano unchanged", () => {
      expect(getEventModeLabel("Mexicano")).toBe("Mexicano")
    })

    it("shows mode label for RankedBox with space", () => {
      expect(getEventModeLabel("RankedBox")).toBe("Ranked Box")
    })
  })

  // ─── Start Event button disabled condition ────────────────────────────────

  describe("Start Event button disabled condition", () => {
    it("is disabled when courts are empty", () => {
      expect(
        isStrictCreateEventDisabled({
          eventName: "Wednesday Ladder",
          eventDate: "2026-05-06",
          eventTime24h: "18:00",
          courts: [],
          playerIds: [],
        }),
      ).toBe(true)
    })

    it("is disabled when player count is less than required", () => {
      expect(
        isStrictCreateEventDisabled({
          eventName: "Wednesday Ladder",
          eventDate: "2026-05-06",
          eventTime24h: "18:00",
          courts: [1],
          playerIds: ["p1", "p2", "p3"], // 1 short
        }),
      ).toBe(true)
    })

    it("is disabled when player count exceeds required", () => {
      expect(
        isStrictCreateEventDisabled({
          eventName: "Wednesday Ladder",
          eventDate: "2026-05-06",
          eventTime24h: "18:00",
          courts: [1],
          playerIds: ["p1", "p2", "p3", "p4", "p5"], // 1 too many
        }),
      ).toBe(true)
    })

    it("is enabled when courts and exact player count are set", () => {
      expect(
        isStrictCreateEventDisabled({
          eventName: "Wednesday Ladder",
          eventDate: "2026-05-06",
          eventTime24h: "18:00",
          courts: [1],
          playerIds: ["p1", "p2", "p3", "p4"],
        }),
      ).toBe(false)
    })

    it("is enabled for two courts with eight players", () => {
      const courts = [1, 2]
      const playerIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]
      expect(playerIds).toHaveLength(getRequiredPlayerCount(courts))
      expect(
        isStrictCreateEventDisabled({
          eventName: "Friday Session",
          eventDate: "2026-05-08",
          eventTime24h: "19:00",
          courts,
          playerIds,
        }),
      ).toBe(false)
    })
  })

  // ─── Disabled start event helper text ─────────────────────────────────────

  describe("disabled start event helper text logic", () => {
    it("shows 'Add players and courts' when courts are empty", () => {
      const courts: number[] = []
      const assignedPlayers: string[] = []
      const requiredPlayers = getRequiredPlayerCount(courts)
      const message =
        courts.length === 0
          ? "Add players and courts to start event"
          : `${requiredPlayers - assignedPlayers.length} more player${requiredPlayers - assignedPlayers.length === 1 ? "" : "s"} needed to start`

      expect(message).toBe("Add players and courts to start event")
    })

    it("shows 'N more players needed' when courts set but players are short", () => {
      const courts = [1, 2]
      const assignedCount = 5
      const requiredPlayers = getRequiredPlayerCount(courts)
      const need = requiredPlayers - assignedCount
      const message =
        courts.length === 0
          ? "Add players and courts to start event"
          : `${need} more player${need === 1 ? "" : "s"} needed to start`

      expect(message).toBe("3 more players needed to start")
    })

    it("uses singular 'player' when exactly 1 is missing", () => {
      const courts = [1]
      const assignedCount = 3
      const requiredPlayers = getRequiredPlayerCount(courts)
      const need = requiredPlayers - assignedCount
      const message =
        courts.length === 0
          ? "Add players and courts to start event"
          : `${need} more player${need === 1 ? "" : "s"} needed to start`

      expect(message).toBe("1 more player needed to start")
    })
  })
})

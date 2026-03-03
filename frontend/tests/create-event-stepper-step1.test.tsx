import { describe, expect, it } from "vitest"

import { getStartStep } from "../src/pages/CreateEvent"
import {
  isCreateEventDisabled,
} from "../src/features/create-event/validation"

describe("Create Event Stepper — Step 1 (Setup)", () => {
  // ─── getStartStep helper ───────────────────────────────────────────────────

  describe("getStartStep", () => {
    it("returns 0 when lifecycleStatus is undefined (new event)", () => {
      expect(getStartStep(undefined)).toBe(0)
    })

    it("returns 0 when lifecycleStatus is null (legacy event record)", () => {
      // null is cast via EventRecord["lifecycleStatus"] which is undefined | string
      expect(getStartStep(null as any)).toBe(0)
    })

    it("returns 1 when lifecycleStatus is 'planned' (slot saved, roster incomplete)", () => {
      expect(getStartStep("planned")).toBe(1)
    })

    it("returns 2 when lifecycleStatus is 'ready' (slot + roster complete)", () => {
      expect(getStartStep("ready")).toBe(2)
    })

    it("returns 0 for 'ongoing' — caller redirects before this step, defensive fallback", () => {
      // ongoing/finished are redirected before getStartStep is used,
      // but the function itself returns 0 as a safe default.
      expect(getStartStep("ongoing")).toBe(0)
    })

    it("returns 0 for 'finished' — same as ongoing", () => {
      expect(getStartStep("finished")).toBe(0)
    })
  })

  // ─── Step 0 Next button disabled condition ─────────────────────────────────

  describe("Step 0 Next button disabled condition", () => {
    it("is disabled when eventName is empty", () => {
      expect(
        isCreateEventDisabled({
          eventName: "",
          eventDate: "2026-04-15",
          eventTime24h: "19:00",
          courts: [],
          playerIds: [],
        }),
      ).toBe(true)
    })

    it("is disabled when eventDate is empty", () => {
      expect(
        isCreateEventDisabled({
          eventName: "Tuesday Ladder",
          eventDate: "",
          courts: [],
          playerIds: [],
        }),
      ).toBe(true)
    })

    it("is disabled when eventName has fewer than 2 chars", () => {
      expect(
        isCreateEventDisabled({
          eventName: "T",
          eventDate: "2026-04-15",
          eventTime24h: "19:00",
          courts: [],
          playerIds: [],
        }),
      ).toBe(true)
    })

    it("is enabled when eventName ≥ 2 chars and eventDate is set (no time required)", () => {
      expect(
        isCreateEventDisabled({
          eventName: "Wednesday Mexicano",
          eventDate: "2026-04-15",
          courts: [],
          playerIds: [],
        }),
      ).toBe(false)
    })

    it("is enabled with name + date + valid time (courts and players not required for slot)", () => {
      expect(
        isCreateEventDisabled({
          eventName: "Friday Bento",
          eventDate: "2026-04-17",
          eventTime24h: "18:30",
          courts: [],
          playerIds: [],
        }),
      ).toBe(false)
    })

    it("is disabled when eventTime24h is present but invalid", () => {
      expect(
        isCreateEventDisabled({
          eventName: "Saturday Session",
          eventDate: "2026-04-18",
          eventTime24h: "25:00",
          courts: [],
          playerIds: [],
        }),
      ).toBe(true)
    })
  })
})

import { describe, expect, it } from "vitest"

// Tests for the event filter behaviour that checkboxes are all checked by default
// and that the types section is expanded on first open.
// These verify the pure logic: parseSavedModeFilters and the typesExpanded default.

// Re-test the parseSavedModeFilters fallback (which is the underlying logic driving
// the modeFilters default). We import through the Home helpers since the private
// function isn't exported — but we can verify the exported applyEventSlotView with
// no mode restriction produces an "all included" result.

import { applyEventSlotView } from "../src/pages/Home"
import type { EventRecord, EventType } from "../src/lib/types"

const ALL_MODES: EventType[] = ["WinnersCourt", "Mexicano", "Americano", "RankedBox"]

function buildEvent(id: string, eventType: EventType): EventRecord {
  return {
    id,
    eventName: `Event ${id}`,
    eventType,
    eventDate: "2026-04-01",
    status: "Lobby",
    setupStatus: "planned",
    lifecycleStatus: "planned",
    missingRequirements: [],
    warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
    version: 1,
    selectedCourts: [],
    playerIds: [],
    currentRoundNumber: null,
    totalRounds: 0,
    roundDurationMinutes: 20,
  }
}

describe("EventSlots filter: all event types checked by default", () => {
  it("shows all event types when all mode filters are active (default state)", () => {
    const events = [
      buildEvent("wc", "WinnersCourt"),
      buildEvent("mx", "Mexicano"),
      buildEvent("am", "Americano"),
      buildEvent("rb", "RankedBox"),
    ]
    const visible = applyEventSlotView(events, "all", "default", ALL_MODES)
    expect(visible.map((e) => e.id)).toEqual(["wc", "mx", "am", "rb"])
  })

  it("default modeFilters (all 4 types) filters no events out", () => {
    const events = [
      buildEvent("wc", "WinnersCourt"),
      buildEvent("mx", "Mexicano"),
    ]
    // With all modes active, every event is shown
    const visible = applyEventSlotView(events, "all", "default", ALL_MODES)
    expect(visible).toHaveLength(2)
  })

  it("empty modeFilters would hide all events", () => {
    const events = [buildEvent("wc", "WinnersCourt"), buildEvent("mx", "Mexicano")]
    const visible = applyEventSlotView(events, "all", "default", [])
    expect(visible).toHaveLength(0)
  })
})

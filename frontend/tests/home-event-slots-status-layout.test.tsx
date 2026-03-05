import { describe, expect, it } from "vitest"

import {
  applyEventSlotView,
  getEventFilterEmptyState,
  getEventSlotDisplay,
  getEventSlotStatusColumnClass,
  matchesEventFilter,
} from "../src/pages/Home"
import type { EventRecord } from "../src/lib/types"

function buildEvent(overrides: Partial<EventRecord>): EventRecord {
  return {
    id: "e1",
    eventName: "Default Event",
    eventType: "WinnersCourt",
    eventDate: "2026-04-20",
    eventTime24h: "18:00",
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
    ...overrides,
  }
}

describe("home event slots status layout", () => {
  it("keeps a dedicated status column class", () => {
    expect(getEventSlotStatusColumnClass()).toBe("event-slot-status-col")
  })

  it("formats event slot display consistently", () => {
    expect(getEventSlotDisplay({ eventDate: "2026-04-20", eventTime24h: "18:00" })).toBe(
      "2026-04-20 18:00",
    )
  })

  it("filters event slots by lifecycle status", () => {
    expect(matchesEventFilter({ lifecycleStatus: "ready", setupStatus: "ready", status: "Lobby" }, "all")).toBe(true)
    expect(matchesEventFilter({ lifecycleStatus: "ready", setupStatus: "ready", status: "Lobby" }, "ready")).toBe(true)
    expect(matchesEventFilter({ lifecycleStatus: "ready", setupStatus: "ready", status: "Lobby" }, "planned")).toBe(false)
    expect(matchesEventFilter({ lifecycleStatus: "ongoing", setupStatus: "ready", status: "Running" }, "ongoing")).toBe(true)
  })

  it("returns specific empty state copy for selected filter", () => {
    expect(getEventFilterEmptyState("all")).toBe("No event slots yet.")
    expect(getEventFilterEmptyState("finished")).toBe("No finished events.")
  })

  it("sorts by date when date ordering is selected", () => {
    const late = buildEvent({ id: "late", eventDate: "2026-04-22", eventTime24h: "20:00" })
    const early = buildEvent({ id: "early", eventDate: "2026-04-21", eventTime24h: "17:00" })
    const visible = applyEventSlotView([late, early], "all", "date", ["WinnersCourt", "Mexicano", "RankedBox"])
    expect(visible.map((event) => event.id)).toEqual(["early", "late"])
  })

  it("groups by mode and honors selected mode filters", () => {
    const winnersCourt = buildEvent({ id: "wc", eventType: "WinnersCourt" })
    const mexicano = buildEvent({ id: "mx", eventType: "Mexicano" })
    const beatTheBox = buildEvent({ id: "btb", eventType: "RankedBox" })

    const visible = applyEventSlotView([mexicano, beatTheBox, winnersCourt], "all", "mode", ["Mexicano", "RankedBox"])
    expect(visible.map((event) => event.id)).toEqual(["mx", "btb"])
  })
})

import { describe, expect, it } from "vitest"

import { isCreateEventDisabled } from "../src/features/create-event/validation"

describe("CreateEvent validation helper", () => {
  it("disables submission when required values are missing", () => {
    expect(
      isCreateEventDisabled({ eventName: "", eventDate: "", courts: [], playerIds: [] }),
    ).toBe(true)
  })

  it("enables submission for valid event payload shape", () => {
    expect(
      isCreateEventDisabled({
        eventName: "Tuesday Ladder",
        eventDate: "2026-03-10",
        eventTime24h: "20:15",
        courts: [1, 2],
        playerIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
      }),
    ).toBe(false)
  })

  it("disables submission when selected players do not match courts x 4", () => {
    expect(
      isCreateEventDisabled({
        eventName: "Tuesday Ladder",
        eventDate: "2026-03-10",
        eventTime24h: "20:15",
        courts: [1, 2],
        playerIds: ["p1", "p2", "p3", "p4"],
      }),
    ).toBe(true)
  })

  it("disables submission when 24-hour time is invalid", () => {
    expect(
      isCreateEventDisabled({
        eventName: "Tuesday Ladder",
        eventDate: "2026-03-10",
        eventTime24h: "24:15",
        courts: [1],
        playerIds: ["p1", "p2", "p3", "p4"],
      }),
    ).toBe(true)
  })
})

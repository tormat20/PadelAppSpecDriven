import { describe, expect, it } from "vitest"

import {
  isCreateEventDisabled,
  isStrictCreateEventDisabled,
} from "../src/features/create-event/validation"

describe("create event dual actions", () => {
  it("keeps strict create disabled until setup is complete", () => {
    expect(
      isStrictCreateEventDisabled({
        eventName: "Night Session",
        eventDate: "2026-04-20",
        eventTime24h: "18:00",
        courts: [1],
        playerIds: ["p1", "p2", "p3"],
      }),
    ).toBe(true)

    expect(
      isStrictCreateEventDisabled({
        eventName: "Night Session",
        eventDate: "2026-04-20",
        eventTime24h: "18:00",
        courts: [1],
        playerIds: ["p1", "p2", "p3", "p4"],
      }),
    ).toBe(false)
  })

  it("allows slot create from planning fields only", () => {
    expect(
      isCreateEventDisabled({
        eventName: "Slot Only",
        eventDate: "2026-04-20",
        eventTime24h: "18:00",
        courts: [],
        playerIds: [],
      }),
    ).toBe(false)
  })
})

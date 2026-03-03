import { describe, expect, it } from "vitest"

import { isCreateEventDisabled } from "../src/features/create-event/validation"

describe("planned slot create validation", () => {
  it("allows create with planning fields only", () => {
    expect(
      isCreateEventDisabled({
        eventName: "Planned Thursday",
        eventDate: "2026-03-10",
        eventTime24h: "19:00",
        courts: [],
        playerIds: [],
      }),
    ).toBe(false)
  })
})

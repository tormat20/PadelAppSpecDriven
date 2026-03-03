import { describe, expect, it } from "vitest"

import { getEventSlotDisplay } from "../src/pages/Home"

describe("planned event status display helpers", () => {
  it("formats event slot date and time", () => {
    expect(getEventSlotDisplay({ eventDate: "2026-03-12", eventTime24h: "18:30" })).toBe(
      "2026-03-12 18:30",
    )
  })
})

import { describe, expect, it } from "vitest"

import { getSummaryBackPath, isRoundColumnLabel } from "../src/pages/Summary"

describe("Summary back navigation to run-event", () => {
  it("returns the run-event route for active event context", () => {
    expect(getSummaryBackPath("evt-123")).toBe("/events/evt-123/run")
  })

  it("keeps final-summary round labels distinct from match labels", () => {
    expect(isRoundColumnLabel("R3")).toBe(true)
    expect(isRoundColumnLabel("M3")).toBe(false)
  })
})

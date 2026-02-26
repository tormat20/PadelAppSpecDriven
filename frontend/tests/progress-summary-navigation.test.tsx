import { describe, expect, it } from "vitest"

import { getSummaryBackPath } from "../src/pages/Summary"

describe("Summary back navigation to run-event", () => {
  it("returns the run-event route for active event context", () => {
    expect(getSummaryBackPath("evt-123")).toBe("/events/evt-123/run")
  })
})

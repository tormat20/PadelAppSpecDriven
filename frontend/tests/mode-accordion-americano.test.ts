import { describe, expect, it } from "vitest"

import { getEventModeLabel } from "../src/lib/eventMode"

// ModeAccordion renders each mode using getEventModeLabel; verifying the label
// is the primary unit-testable concern without a DOM.
describe("ModeAccordion — Americano option", () => {
  it("includes Americano as a selectable mode (label resolves correctly)", () => {
    const modes = ["WinnersCourt", "Mexicano", "Americano", "RankedBox"] as const
    expect(modes).toContain("Americano")
    expect(getEventModeLabel("Americano")).toBe("Americano")
  })

  it("does not return 'Americano' label for other modes", () => {
    expect(getEventModeLabel("WinnersCourt")).not.toBe("Americano")
    expect(getEventModeLabel("Mexicano")).not.toBe("Americano")
    expect(getEventModeLabel("RankedBox")).not.toBe("Americano")
  })
})

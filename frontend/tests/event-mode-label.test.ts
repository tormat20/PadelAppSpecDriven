import { describe, expect, it } from "vitest"

import { getEventModeLabel } from "../src/lib/eventMode"

describe("Event mode labels", () => {
  it("maps WinnersCourt to Winners Court label", () => {
    expect(getEventModeLabel("WinnersCourt")).toBe("Winners Court")
  })

  it("keeps other mode labels unchanged", () => {
    expect(getEventModeLabel("Mexicano")).toBe("Mexicano")
    expect(getEventModeLabel("RankedBox")).toBe("Ranked Box")
  })

  it("returns Americano as-is", () => {
    expect(getEventModeLabel("Americano")).toBe("Americano")
  })
})

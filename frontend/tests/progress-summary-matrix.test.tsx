import { describe, expect, it } from "vitest"

import { getProgressCellDisplay } from "../src/pages/Summary"

describe("Summary progress matrix rendering", () => {
  it("renders '-' for missing or empty values", () => {
    expect(getProgressCellDisplay("")).toBe("-")
    expect(getProgressCellDisplay("   ")).toBe("-")
    expect(getProgressCellDisplay(undefined)).toBe("-")
    expect(getProgressCellDisplay(null)).toBe("-")
  })

  it("preserves played values", () => {
    expect(getProgressCellDisplay("W")).toBe("W")
    expect(getProgressCellDisplay("17")).toBe("17")
  })
})

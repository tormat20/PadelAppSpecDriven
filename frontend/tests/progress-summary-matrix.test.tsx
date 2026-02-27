import { describe, expect, it } from "vitest"

import {
  getFinalRowTotal,
  getFinalSummarySubtitle,
  getProgressCellDisplay,
  isRoundColumnLabel,
  sortFinalRowsByScore,
} from "../src/pages/Summary"

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
    expect(getProgressCellDisplay("0")).toBe("0")
  })

  it("recognizes final round column labels", () => {
    expect(isRoundColumnLabel("R1")).toBe(true)
    expect(isRoundColumnLabel("R6")).toBe(true)
    expect(isRoundColumnLabel("Round 1")).toBe(false)
    expect(isRoundColumnLabel("M1")).toBe(false)
  })

  it("uses round-based final subtitle copy", () => {
    expect(getFinalSummarySubtitle()).toBe("Final player stats by round and total.")
  })

  it("extracts total column value from final rows", () => {
    expect(
      getFinalRowTotal([
        { columnId: "round-1", value: "5" },
        { columnId: "total", value: "42" },
      ]),
    ).toBe(42)
  })

  it("sorts final rows by descending total score", () => {
    const rows = [
      {
        playerId: "p-low",
        displayName: "Low",
        cells: [{ columnId: "total", value: "1" }],
      },
      {
        playerId: "p-high",
        displayName: "High",
        cells: [{ columnId: "total", value: "9" }],
      },
    ]

    const sorted = sortFinalRowsByScore(rows)
    expect(sorted[0].playerId).toBe("p-high")
    expect(sorted[1].playerId).toBe("p-low")
  })
})

import { describe, expect, it } from "vitest"

import { getSummaryColumnsWithRank } from "../src/features/summary/rankOrdering"

describe("Summary rank column layout", () => {
  it("prepends Rank column before player/round columns", () => {
    const columns = [
      { id: "round-1", label: "R1" },
      { id: "total", label: "Total" },
    ]
    const withRank = getSummaryColumnsWithRank(columns)

    expect(withRank[0]).toEqual({ id: "rank", label: "Rank" })
    expect(withRank[1]).toEqual({ id: "player", label: "Player" })
    expect(withRank[2]).toEqual({ id: "round-1", label: "R1" })
    expect(withRank[withRank.length - 1]).toEqual({ id: "total", label: "Total" })
  })
})

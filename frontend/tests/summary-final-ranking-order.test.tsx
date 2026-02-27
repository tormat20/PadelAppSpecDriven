import { describe, expect, it } from "vitest"

import { getRowRank, sortRowsByRank } from "../src/features/summary/rankOrdering"

describe("Final summary rank ordering helpers", () => {
  it("sorts rows by rank ascending", () => {
    const rows = [
      { rank: 3, playerId: "p3", displayName: "C", cells: [] },
      { rank: 1, playerId: "p1", displayName: "A", cells: [] },
      { rank: 2, playerId: "p2", displayName: "B", cells: [] },
    ]

    const sorted = sortRowsByRank(rows)
    expect(sorted.map((row) => row.playerId)).toEqual(["p1", "p2", "p3"])
  })

  it("returns row rank when rank is present", () => {
    const row = { rank: 4, playerId: "p4", displayName: "D", cells: [] }
    expect(getRowRank(row, 0)).toBe(4)
  })
})

import { describe, expect, it } from "vitest"

import { isPlayerCrowned, toCrownedPlayerSet } from "../src/features/summary/crownWinners"
import { sortRowsByRank } from "../src/features/summary/rankOrdering"

describe("Summary crown/ranking regression", () => {
  it("keeps crown matching by player identity after rank ordering", () => {
    const rows = sortRowsByRank([
      { rank: 2, playerId: "p2", displayName: "B", cells: [] },
      { rank: 1, playerId: "p1", displayName: "A", cells: [] },
    ])
    const crowned = toCrownedPlayerSet(["p2"])

    expect(rows[0].playerId).toBe("p1")
    expect(rows[1].playerId).toBe("p2")
    expect(isPlayerCrowned(crowned, rows[0].playerId)).toBe(false)
    expect(isPlayerCrowned(crowned, rows[1].playerId)).toBe(true)
  })
})

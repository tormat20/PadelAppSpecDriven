import { describe, expect, it } from "vitest"

import {
  toAmericanoPayload,
  getMirroredBadgePair,
  getSideRelativeSelectionKey,
  getWinnerSelectionKey,
} from "../src/features/run-event/resultEntry"

describe("ResultEntry — Americano Score24 routing", () => {
  it("toAmericanoPayload assigns team1Score when side 1 selects", () => {
    expect(toAmericanoPayload(1, 17)).toEqual({ mode: "Americano", team1Score: 17, team2Score: 7 })
  })

  it("toAmericanoPayload assigns team2Score when side 2 selects", () => {
    expect(toAmericanoPayload(2, 17)).toEqual({ mode: "Americano", team1Score: 7, team2Score: 17 })
  })

  it("scores always sum to 24", () => {
    for (let s = 1; s <= 23; s++) {
      const p = toAmericanoPayload(1, s)
      expect(p.team1Score + p.team2Score).toBe(24)
    }
  })

  it("getMirroredBadgePair returns correct string scores for Americano", () => {
    expect(getMirroredBadgePair({ mode: "Americano", team1Score: 15, team2Score: 9 })).toEqual({
      team1: "15",
      team2: "9",
    })
  })

  it("getSideRelativeSelectionKey returns score string for Americano", () => {
    const payload = { mode: "Americano" as const, team1Score: 18, team2Score: 6 }
    expect(getSideRelativeSelectionKey(payload, 1)).toBe("18")
    expect(getSideRelativeSelectionKey(payload, 2)).toBe("6")
  })

  it("getWinnerSelectionKey returns score key for Americano", () => {
    expect(getWinnerSelectionKey({ mode: "Americano", team1Score: 12, team2Score: 12 })).toBe("12-12")
  })
})

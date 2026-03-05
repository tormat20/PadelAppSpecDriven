import { describe, expect, it } from "vitest"

import {
  clearWinnerSelection,
  getMirroredBadgePair,
  getSideRelativeSelectionKey,
  isWinnerOptionSelected,
  toWinnersCourtPayload,
  toRankedBoxPayload,
  upsertWinnerSelection,
} from "../src/features/run-event/resultEntry"

describe("ResultEntry winner selected-state persistence", () => {
  it("stores the most recent winner selection per match", () => {
    const state = upsertWinnerSelection({}, "m1", { mode: "WinnersCourt", winningTeam: 1 })
    expect(isWinnerOptionSelected(state, "m1", "team1")).toBe(true)
    expect(isWinnerOptionSelected(state, "m1", "team2")).toBe(false)
  })

  it("overwrites prior selection for the same match and clears when requested", () => {
    const state = upsertWinnerSelection({}, "m1", { mode: "RankedBox", outcome: "Team1Win" })
    const updated = upsertWinnerSelection(state, "m1", { mode: "RankedBox", outcome: "Draw" })
    expect(isWinnerOptionSelected(updated, "m1", "Draw")).toBe(true)

    const cleared = clearWinnerSelection(updated, "m1")
    expect(isWinnerOptionSelected(cleared, "m1", "Draw")).toBe(false)
  })

  it("builds side-relative winner payload semantics", () => {
    expect(toWinnersCourtPayload(2, "Win")).toEqual({ mode: "WinnersCourt", winningTeam: 2 })
    expect(toWinnersCourtPayload(2, "Loss")).toEqual({ mode: "WinnersCourt", winningTeam: 1 })

    expect(toRankedBoxPayload(1, "Win")).toEqual({ mode: "RankedBox", outcome: "Team1Win" })
    expect(toRankedBoxPayload(1, "Loss")).toEqual({ mode: "RankedBox", outcome: "Team2Win" })
  })

  it("derives side-relative selection keys from submitted payload", () => {
    expect(getSideRelativeSelectionKey({ mode: "WinnersCourt", winningTeam: 2 }, 2)).toBe("Win")
    expect(getSideRelativeSelectionKey({ mode: "WinnersCourt", winningTeam: 2 }, 1)).toBe("Loss")
    expect(getSideRelativeSelectionKey({ mode: "RankedBox", outcome: "Draw" }, 1)).toBe("Draw")
  })

  it("derives mirrored badges for win/loss and draw modes", () => {
    expect(getMirroredBadgePair({ mode: "WinnersCourt", winningTeam: 1 })).toEqual({ team1: "Win", team2: "Loss" })
    expect(getMirroredBadgePair({ mode: "WinnersCourt", winningTeam: 2 })).toEqual({ team1: "Loss", team2: "Win" })
    expect(getMirroredBadgePair({ mode: "RankedBox", outcome: "Draw" })).toEqual({ team1: "Draw", team2: "Draw" })
  })
})

import { describe, expect, it } from "vitest"

import {
  clearWinnerSelection,
  getMirroredBadgePair,
  getSideRelativeSelectionKey,
  isWinnerOptionSelected,
  toAmericanoPayload,
  toBeatTheBoxPayload,
  upsertWinnerSelection,
} from "../src/features/run-event/resultEntry"

describe("ResultEntry winner selected-state persistence", () => {
  it("stores the most recent winner selection per match", () => {
    const state = upsertWinnerSelection({}, "m1", { mode: "Americano", winningTeam: 1 })
    expect(isWinnerOptionSelected(state, "m1", "team1")).toBe(true)
    expect(isWinnerOptionSelected(state, "m1", "team2")).toBe(false)
  })

  it("overwrites prior selection for the same match and clears when requested", () => {
    const state = upsertWinnerSelection({}, "m1", { mode: "BeatTheBox", outcome: "Team1Win" })
    const updated = upsertWinnerSelection(state, "m1", { mode: "BeatTheBox", outcome: "Draw" })
    expect(isWinnerOptionSelected(updated, "m1", "Draw")).toBe(true)

    const cleared = clearWinnerSelection(updated, "m1")
    expect(isWinnerOptionSelected(cleared, "m1", "Draw")).toBe(false)
  })

  it("builds side-relative winner payload semantics", () => {
    expect(toAmericanoPayload(2, "Win")).toEqual({ mode: "Americano", winningTeam: 2 })
    expect(toAmericanoPayload(2, "Loss")).toEqual({ mode: "Americano", winningTeam: 1 })

    expect(toBeatTheBoxPayload(1, "Win")).toEqual({ mode: "BeatTheBox", outcome: "Team1Win" })
    expect(toBeatTheBoxPayload(1, "Loss")).toEqual({ mode: "BeatTheBox", outcome: "Team2Win" })
  })

  it("derives side-relative selection keys from submitted payload", () => {
    expect(getSideRelativeSelectionKey({ mode: "Americano", winningTeam: 2 }, 2)).toBe("Win")
    expect(getSideRelativeSelectionKey({ mode: "Americano", winningTeam: 2 }, 1)).toBe("Loss")
    expect(getSideRelativeSelectionKey({ mode: "BeatTheBox", outcome: "Draw" }, 1)).toBe("Draw")
  })

  it("derives mirrored badges for win/loss and draw modes", () => {
    expect(getMirroredBadgePair({ mode: "Americano", winningTeam: 1 })).toEqual({ team1: "Win", team2: "Loss" })
    expect(getMirroredBadgePair({ mode: "Americano", winningTeam: 2 })).toEqual({ team1: "Loss", team2: "Win" })
    expect(getMirroredBadgePair({ mode: "BeatTheBox", outcome: "Draw" })).toEqual({ team1: "Draw", team2: "Draw" })
  })
})

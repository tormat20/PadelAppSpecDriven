import { describe, expect, it } from "vitest"

import { toWinnersCourtPayload, toRankedBoxPayload } from "../src/features/run-event/resultEntry"

describe("RunEvent result modal mode options", () => {
  it("maps WinnersCourt side-relative win/loss selections", () => {
    expect(toWinnersCourtPayload(1, "Win")).toEqual({ mode: "WinnersCourt", winningTeam: 1 })
    expect(toWinnersCourtPayload(1, "Loss")).toEqual({ mode: "WinnersCourt", winningTeam: 2 })
  })

  it("maps RankedBox side-relative options including draw", () => {
    expect(toRankedBoxPayload(2, "Win")).toEqual({ mode: "RankedBox", outcome: "Team2Win" })
    expect(toRankedBoxPayload(2, "Loss")).toEqual({ mode: "RankedBox", outcome: "Team1Win" })
    expect(toRankedBoxPayload(2, "Draw")).toEqual({ mode: "RankedBox", outcome: "Draw" })
  })
})

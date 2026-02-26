import { describe, expect, it } from "vitest"

import { RUN_PAGE_ACTIONS, canAdvanceRound } from "../src/pages/RunEvent"

describe("RunEvent helpers", () => {
  it("requires every match to be completed before allowing next round", () => {
    const roundData = { matches: [{ matchId: "m1" }, { matchId: "m2" }] }

    expect(canAdvanceRound(roundData, { m1: true })).toBe(false)
    expect(canAdvanceRound(roundData, { m1: true, m2: true })).toBe(true)
  })

  it("exposes stable run page action labels", () => {
    expect(RUN_PAGE_ACTIONS).toEqual(["Next Match", "Finish", "Go to Summary"])
  })
})

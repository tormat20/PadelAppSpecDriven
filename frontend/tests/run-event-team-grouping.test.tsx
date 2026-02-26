import { describe, expect, it } from "vitest"

import { selectTeamGrouping } from "../src/components/courts/CourtGrid"

describe("RunEvent team grouping click interactions", () => {
  it("keeps selection per match when team grouping is clicked", () => {
    const state = selectTeamGrouping({}, "m1", 1)
    const next = selectTeamGrouping(state, "m2", 2)

    expect(next).toEqual({ m1: 1, m2: 2 })
  })

  it("updates selected team when same match changes", () => {
    const state = selectTeamGrouping({ m1: 1 }, "m1", 2)
    expect(state.m1).toBe(2)
  })
})

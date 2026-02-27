import { describe, expect, it } from "vitest"

import { selectTeamGrouping } from "../src/components/courts/CourtGrid"
import { mapSubmittedPayloadsToBadges } from "../src/pages/RunEvent"

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

  it("maps submitted payloads to inline mirrored badge values", () => {
    const badges = mapSubmittedPayloadsToBadges({
      m1: { mode: "Americano", winningTeam: 1 },
      m2: { mode: "Mexicano", team1Score: 18, team2Score: 6 },
    })

    expect(badges.m1).toEqual({ team1: "Win", team2: "Loss" })
    expect(badges.m2).toEqual({ team1: "18", team2: "6" })
  })
})

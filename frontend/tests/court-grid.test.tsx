import { describe, expect, it } from "vitest"

import { CourtGrid } from "../src/components/courts/CourtGrid"

describe("CourtGrid", () => {
  it("is defined and returns a React element", () => {
    const element = CourtGrid({
      matches: [
        {
          matchId: "m1",
          courtNumber: 1,
          teamA: { players: [{ id: "p1", displayName: "Alice" }, { id: "p2", displayName: "Bob" }] },
          teamB: {
            players: [
              { id: "p3", displayName: "Carla" },
              { id: "p4", displayName: "Daniel" },
            ],
          },
          inputType: "WinLoss",
          status: "Pending",
        },
      ],
    })

    expect(CourtGrid).toBeTypeOf("function")
    expect(element).toBeTruthy()
  })

  it("handles empty match list", () => {
    const element = CourtGrid({ matches: [] })
    expect(element).toBeTruthy()
  })

  it("renders with tinted team controls and inline result badges", () => {
    const element = CourtGrid({
      matches: [
        {
          matchId: "m1",
          courtNumber: 1,
          team1: ["Alice", "Bob"],
          team2: ["Carla", "Daniel"],
        },
      ],
      showCourtImage: true,
      resultBadgeByMatch: { m1: { team1: "Win", team2: "Loss" } },
    })

    expect(element).toBeTruthy()
  })
})

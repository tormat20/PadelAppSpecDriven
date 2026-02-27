import { describe, expect, it } from "vitest"

import { COURT_IMAGE_SRC, CourtGrid } from "../src/components/courts/CourtGrid"
import { mapMatchPlayersToDisplayNames } from "../src/pages/RunEvent"

describe("RunEvent court card rendering with image context", () => {
  it("uses provided court image asset path", () => {
    expect(COURT_IMAGE_SRC).toBe("/images/courts/court-bg-removed.png")
  })

  it("renders court grid with lightweight run-event match shape", () => {
    const view = CourtGrid({
      matches: [
        {
          matchId: "m1",
          courtNumber: 1,
          team1: ["Alice", "Bob"],
          team2: ["Carla", "Daniel"],
        },
      ],
      showCourtImage: true,
    })

    expect(view).toBeTruthy()
  })

  it("supports inline team badge values without footer helper text", () => {
    const view = CourtGrid({
      matches: [
        {
          matchId: "m1",
          courtNumber: 2,
          team1: ["A", "B"],
          team2: ["C", "D"],
        },
      ],
      resultBadgeByMatch: { m1: { team1: "15", team2: "9" } },
    })

    expect(view).toBeTruthy()
  })

  it("maps team identifiers to display names when available", () => {
    const matches = [
      { matchId: "m1", courtNumber: 1, team1: ["p1", "p2"], team2: ["p3", "p4"] },
    ]

    const mapped = mapMatchPlayersToDisplayNames(matches, {
      p1: "Alice",
      p2: "Bob",
      p3: "Carla",
      p4: "Daniel",
    })

    expect(mapped[0].team1).toEqual(["Alice", "Bob"])
    expect(mapped[0].team2).toEqual(["Carla", "Daniel"])
  })
})

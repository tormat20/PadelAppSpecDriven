import { describe, expect, it } from "vitest"

import { getRosterHints } from "../src/features/create-event/rosterHints"

describe("getRosterHints", () => {
  it("shows 'Choose courts' when no courts are selected", () => {
    const hints = getRosterHints([], [])
    expect(hints.showChooseCourts).toBe(true)
    expect(hints.showAssignPlayers).toBe(false)
  })

  it("hides 'Choose courts' and shows 'Assign players' when 1 court selected but no players", () => {
    const hints = getRosterHints([1], [])
    expect(hints.showChooseCourts).toBe(false)
    expect(hints.showAssignPlayers).toBe(true)
  })

  it("hides both hints when 1 court and 4 players assigned", () => {
    const players = ["p1", "p2", "p3", "p4"]
    const hints = getRosterHints([1], players)
    expect(hints.showChooseCourts).toBe(false)
    expect(hints.showAssignPlayers).toBe(false)
  })

  it("hides both hints when 2 courts and 8 players assigned", () => {
    const courts = [1, 2]
    const players = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]
    const hints = getRosterHints(courts, players)
    expect(hints.showChooseCourts).toBe(false)
    expect(hints.showAssignPlayers).toBe(false)
  })

  it("shows 'Assign players' when 2 courts and only 7 players assigned", () => {
    const courts = [1, 2]
    const players = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"]
    const hints = getRosterHints(courts, players)
    expect(hints.showChooseCourts).toBe(false)
    expect(hints.showAssignPlayers).toBe(true)
  })

  it("shows 'Assign players' when courts change and player count no longer matches", () => {
    // Had 1 court + 4 players (valid), then added a second court → now needs 8
    const courts = [1, 2]
    const players = ["p1", "p2", "p3", "p4"]
    const hints = getRosterHints(courts, players)
    expect(hints.showChooseCourts).toBe(false)
    expect(hints.showAssignPlayers).toBe(true)
  })

  it("does not show 'Assign players' when courts are zero (even if players present)", () => {
    // No courts selected — 'Assign players' gate requires courts > 0
    const hints = getRosterHints([], ["p1", "p2", "p3", "p4"])
    expect(hints.showChooseCourts).toBe(true)
    expect(hints.showAssignPlayers).toBe(false)
  })

  it("shows 'Assign players' when player count exceeds required (too many players)", () => {
    const courts = [1]
    const players = ["p1", "p2", "p3", "p4", "p5"] // 5 > 4 required
    const hints = getRosterHints(courts, players)
    expect(hints.showAssignPlayers).toBe(true)
  })
})

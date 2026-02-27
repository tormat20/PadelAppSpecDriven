import { describe, expect, it } from "vitest"

import { addAssignedPlayer, getAddPlayerMessage } from "../src/components/players/PlayerSelector"

describe("player add-and-assign helpers", () => {
  it("adds a new assigned player once", () => {
    const initial = [{ id: "p1", displayName: "Alberta" }]

    const next = addAssignedPlayer(initial, { id: "p2", displayName: "Amelia" })
    const duplicate = addAssignedPlayer(next, { id: "p2", displayName: "Amelia" })

    expect(next).toHaveLength(2)
    expect(duplicate).toHaveLength(2)
  })

  it("returns created flow message when player is new", () => {
    expect(getAddPlayerMessage(false)).toContain("created")
  })

  it("supports growing assigned player collection without truncation", () => {
    let players = [] as Array<{ id: string; displayName: string }>
    for (let index = 1; index <= 12; index += 1) {
      players = addAssignedPlayer(players, { id: `p${index}`, displayName: `Player ${index}` })
    }

    expect(players).toHaveLength(12)
    expect(players[11].displayName).toBe("Player 12")
  })
})

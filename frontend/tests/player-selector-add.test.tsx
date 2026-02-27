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
})

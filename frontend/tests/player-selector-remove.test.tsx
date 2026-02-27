import { describe, expect, it } from "vitest"

import { removeAssignedPlayer } from "../src/components/players/PlayerSelector"

describe("assigned player removal", () => {
  it("removes only selected player from draft assignment list", () => {
    const assigned = [
      { id: "p1", displayName: "Alberta" },
      { id: "p2", displayName: "Amelia" },
    ]

    const next = removeAssignedPlayer(assigned, "p1")

    expect(next).toEqual([{ id: "p2", displayName: "Amelia" }])
  })
})

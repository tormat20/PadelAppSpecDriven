import { describe, expect, it } from "vitest"

import { getAddPlayerMessage } from "../src/components/players/PlayerSelector"
import { createOrReusePlayer } from "../src/lib/api"

describe("duplicate player handling", () => {
  it("reuses existing catalog entry for case-insensitive duplicate", async () => {
    const catalog = [{ id: "p1", displayName: "Alberta" }]

    const result = await createOrReusePlayer("alBErta", catalog)

    expect(result.reused).toBe(true)
    expect(result.player.id).toBe("p1")
  })

  it("returns reused flow message when duplicate is found", () => {
    expect(getAddPlayerMessage(true)).toContain("reused")
  })
})

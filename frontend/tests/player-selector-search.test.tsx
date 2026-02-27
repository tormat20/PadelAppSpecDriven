import { describe, expect, it } from "vitest"

import { filterPrefixSuggestions } from "../src/features/create-event/playerSearch"
import { PLAYER_SECTION_TITLE } from "../src/components/players/PlayerSelector"

describe("player prefix suggestions", () => {
  it("starts matching from one typed character", () => {
    const catalog = [
      { id: "p1", displayName: "Alberta" },
      { id: "p2", displayName: "Amelia" },
      { id: "p3", displayName: "Bianca" },
    ]

    const results = filterPrefixSuggestions(catalog, "a")
    expect(results.map((p) => p.displayName)).toEqual(["Alberta", "Amelia"])
  })

  it("matches prefix case-insensitively", () => {
    const catalog = [{ id: "p1", displayName: "Alberta" }]
    expect(filterPrefixSuggestions(catalog, "A")).toHaveLength(1)
    expect(filterPrefixSuggestions(catalog, "aL")).toHaveLength(1)
  })

  it("narrows suggestions as query grows", () => {
    const catalog = [
      { id: "p1", displayName: "Alberta" },
      { id: "p2", displayName: "Alex" },
      { id: "p3", displayName: "Alice" },
    ]

    expect(filterPrefixSuggestions(catalog, "a").map((player) => player.displayName)).toEqual([
      "Alberta",
      "Alex",
      "Alice",
    ])
    expect(filterPrefixSuggestions(catalog, "al").map((player) => player.displayName)).toEqual([
      "Alberta",
      "Alex",
      "Alice",
    ])
    expect(filterPrefixSuggestions(catalog, "ale").map((player) => player.displayName)).toEqual(["Alex"])
  })

  it("uses Players as section heading label", () => {
    expect(PLAYER_SECTION_TITLE).toBe("Players")
  })
})

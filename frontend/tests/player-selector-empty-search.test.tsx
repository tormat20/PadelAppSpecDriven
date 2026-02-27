import { describe, expect, it } from "vitest"

import { filterPrefixSuggestions } from "../src/features/create-event/playerSearch"

describe("player empty-search behavior", () => {
  it("returns no suggestions when there are no matches", () => {
    const catalog = [{ id: "p1", displayName: "Bianca" }]
    expect(filterPrefixSuggestions(catalog, "a")).toEqual([])
  })

  it("returns no suggestions before first character", () => {
    const catalog = [{ id: "p1", displayName: "Alberta" }]
    expect(filterPrefixSuggestions(catalog, "")).toEqual([])
  })
})

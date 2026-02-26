import { describe, expect, it } from "vitest"

import {
  getActiveSuggestion,
  getInitialActiveSuggestionIndex,
  getListboxOptionId,
  getNextActiveSuggestionIndex,
  LISTBOX_NAVIGATION_KEYS,
} from "../src/features/create-event/playerSearch"

describe("PlayerSelector listbox keyboard and mouse behavior", () => {
  it("starts with first option active when suggestions exist", () => {
    const suggestions = [{ id: "p1", displayName: "Alex" }]
    expect(getInitialActiveSuggestionIndex(suggestions)).toBe(0)
    expect(getInitialActiveSuggestionIndex([])).toBe(-1)
  })

  it("cycles active option for arrow keys", () => {
    expect(
      getNextActiveSuggestionIndex({
        key: LISTBOX_NAVIGATION_KEYS.next,
        activeIndex: 0,
        suggestionCount: 3,
      }),
    ).toBe(1)

    expect(
      getNextActiveSuggestionIndex({
        key: LISTBOX_NAVIGATION_KEYS.previous,
        activeIndex: 0,
        suggestionCount: 3,
      }),
    ).toBe(2)
  })

  it("resolves active suggestion and stable option ids", () => {
    const suggestions = [
      { id: "p1", displayName: "Alex" },
      { id: "p2", displayName: "Alice" },
    ]

    expect(getActiveSuggestion(suggestions, 1)?.displayName).toBe("Alice")
    expect(getActiveSuggestion(suggestions, 2)).toBeNull()
    expect(getListboxOptionId("p2")).toBe("player-option-p2")
  })
})

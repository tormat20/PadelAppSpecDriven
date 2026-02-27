import { describe, expect, it } from "vitest"

import { getEventModeLabel } from "../src/lib/eventMode"

describe("Event mode labels", () => {
  it("maps Americano to Winners Court label", () => {
    expect(getEventModeLabel("Americano")).toBe("Winners Court")
  })

  it("keeps other mode labels unchanged", () => {
    expect(getEventModeLabel("Mexicano")).toBe("Mexicano")
    expect(getEventModeLabel("BeatTheBox")).toBe("BeatTheBox")
  })
})

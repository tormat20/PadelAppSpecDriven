import { describe, expect, it } from "vitest"

import { hasInteractiveSurface } from "../src/features/interaction/surfaceClass"

describe("Interaction accessibility guard rails", () => {
  it("requires interactive surface class for focus-visible styling", () => {
    expect(hasInteractiveSurface("button interactive-surface")).toBe(true)
  })
})

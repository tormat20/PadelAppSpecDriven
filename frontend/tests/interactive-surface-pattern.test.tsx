import { describe, expect, it } from "vitest"

import { hasInteractiveSurface, withInteractiveSurface } from "../src/features/interaction/surfaceClass"

describe("Interactive surface class helpers", () => {
  it("adds interactive-surface class once", () => {
    expect(withInteractiveSurface("button")).toBe("button interactive-surface")
    expect(withInteractiveSurface("button interactive-surface")).toBe("button interactive-surface")
  })

  it("detects interactive-surface class", () => {
    expect(hasInteractiveSurface("button interactive-surface")).toBe(true)
    expect(hasInteractiveSurface("button")).toBe(false)
  })
})

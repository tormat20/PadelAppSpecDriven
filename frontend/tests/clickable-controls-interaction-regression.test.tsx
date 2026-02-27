import { describe, expect, it } from "vitest"

import { withInteractiveSurface } from "../src/features/interaction/surfaceClass"

describe("Clickable controls interaction regression", () => {
  it("keeps shared interaction class on key control types", () => {
    const controls = [
      withInteractiveSurface("button"),
      withInteractiveSurface("button-secondary"),
      withInteractiveSurface("menu-card"),
      withInteractiveSurface("mode-card"),
      withInteractiveSurface("court-button"),
      withInteractiveSurface("result-option"),
      withInteractiveSurface("logo-button"),
    ]
    expect(controls.every((entry) => entry.includes("interactive-surface"))).toBe(true)
  })
})

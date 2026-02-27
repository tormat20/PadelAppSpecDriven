import { describe, expect, it, vi } from "vitest"

import { getEffectiveTimeScale } from "../src/components/backgrounds/Prism"

describe("Prism reduced motion behavior", () => {
  it("returns configured timeScale when reduced-motion is not active", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    })

    expect(getEffectiveTimeScale(0.5)).toBe(0.5)
    vi.unstubAllGlobals()
  })

  it("returns zero when reduced-motion is active", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: true }),
    })

    expect(getEffectiveTimeScale(0.5)).toBe(0)
    vi.unstubAllGlobals()
  })
})

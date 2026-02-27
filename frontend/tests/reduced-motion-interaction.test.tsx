import { describe, expect, it } from "vitest"

import { isProximityAnimationEnabled, toPercentage } from "../src/components/interaction/usePointerProximity"

describe("Reduced motion interaction behavior", () => {
  it("disables proximity animation when reduced-motion is active", () => {
    expect(isProximityAnimationEnabled(false, true)).toBe(false)
  })

  it("normalizes pointer percentages", () => {
    expect(toPercentage(120)).toBe("100.00%")
    expect(toPercentage(-10)).toBe("0.00%")
  })
})

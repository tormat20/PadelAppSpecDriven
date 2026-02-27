import { describe, expect, it } from "vitest"

import { isProximityAnimationEnabled } from "../src/components/interaction/usePointerProximity"

describe("Disabled state interaction behavior", () => {
  it("disables proximity animation for disabled controls", () => {
    expect(isProximityAnimationEnabled(true, false)).toBe(false)
  })

  it("keeps proximity animation enabled for active controls", () => {
    expect(isProximityAnimationEnabled(false, false)).toBe(true)
  })
})

import { describe, expect, it } from "vitest"

import { DEFAULT_PRISM_PROPS } from "../src/components/backgrounds/Prism"

describe("Prism background global defaults", () => {
  it("keeps expected default visual configuration", () => {
    expect(DEFAULT_PRISM_PROPS.animationType).toBe("rotate")
    expect(DEFAULT_PRISM_PROPS.timeScale).toBe(0.5)
    expect(DEFAULT_PRISM_PROPS.height).toBe(3.5)
    expect(DEFAULT_PRISM_PROPS.baseWidth).toBe(4.7)
    expect(DEFAULT_PRISM_PROPS.scale).toBe(3.6)
    expect(DEFAULT_PRISM_PROPS.colorFrequency).toBe(0.95)
    expect(DEFAULT_PRISM_PROPS.noise).toBe(0)
    expect(DEFAULT_PRISM_PROPS.glow).toBe(1)
  })
})

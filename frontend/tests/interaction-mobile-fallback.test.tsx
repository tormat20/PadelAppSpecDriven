import { describe, expect, it } from "vitest"

import { shouldRenderLogoText } from "../src/components/branding/LogoButton"

describe("Interaction mobile fallback behavior", () => {
  it("keeps logo text disabled on mobile fallback", () => {
    expect(shouldRenderLogoText()).toBe(false)
  })
})

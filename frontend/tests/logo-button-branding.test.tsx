import { describe, expect, it } from "vitest"

import { LOGO_BUTTON_ARIA_LABEL, MOLNDAL_LOGO_SRC, shouldRenderLogoText } from "../src/components/branding/LogoButton"

describe("Logo button branding", () => {
  it("uses the Molndal logo asset path", () => {
    expect(MOLNDAL_LOGO_SRC).toBe("/images/logos/Molndal-padel-bg-removed.png")
  })

  it("uses accessible logo button label", () => {
    expect(LOGO_BUTTON_ARIA_LABEL).toBe("Go home")
  })

  it("keeps logo text disabled", () => {
    expect(shouldRenderLogoText()).toBe(false)
  })
})

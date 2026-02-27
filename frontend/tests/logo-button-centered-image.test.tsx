import { describe, expect, it } from "vitest"

import { MOLNDAL_LOGO_SRC, shouldRenderLogoText } from "../src/components/branding/LogoButton"

describe("Logo button centered image behavior", () => {
  it("keeps centered logo asset source stable", () => {
    expect(MOLNDAL_LOGO_SRC).toBe("/images/logos/Molndal-padel-bg-removed.png")
  })

  it("keeps text disabled for image-only logo button", () => {
    expect(shouldRenderLogoText()).toBe(false)
  })
})

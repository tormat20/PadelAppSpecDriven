import { describe, expect, it } from "vitest"

import { shouldRenderLogoText } from "../src/components/branding/LogoButton"

describe("Logo button responsive text", () => {
  it("disables optional logo text", () => {
    expect(shouldRenderLogoText()).toBe(false)
  })
})

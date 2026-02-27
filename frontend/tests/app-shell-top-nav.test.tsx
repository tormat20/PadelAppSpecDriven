import { describe, expect, it } from "vitest"

import { TOP_NAV_ARIA_LABEL } from "../src/app/AppShell"

describe("App shell top navigation", () => {
  it("uses primary placeholder navigation label", () => {
    expect(TOP_NAV_ARIA_LABEL).toBe("Primary placeholder navigation")
  })
})

import { describe, expect, it } from "vitest"

import { getMenuCardClassName } from "../src/components/bento/MagicBentoMenu"

describe("Magic bento interaction class", () => {
  it("uses shared interactive-surface class on menu cards", () => {
    expect(getMenuCardClassName()).toContain("menu-card")
    expect(getMenuCardClassName()).toContain("interactive-surface")
  })
})

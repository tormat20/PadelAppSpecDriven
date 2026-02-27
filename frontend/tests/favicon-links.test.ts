import { describe, expect, it } from "vitest"

import indexHtml from "../index.html?raw"

describe("favicon link configuration", () => {
  it("contains SVG primary and PNG fallback links", () => {
    expect(indexHtml).toContain('/icons/molndal-padel-favicon.svg')
    expect(indexHtml).toContain('/icons/molndal-padel-favicon.png')
  })
})

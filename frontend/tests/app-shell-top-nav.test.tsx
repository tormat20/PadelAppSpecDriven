import { describe, expect, it } from "vitest"

import { CardNav } from "../src/components/nav/CardNav"

describe("App shell top navigation", () => {
  it("CardNav component is exported", () => {
    expect(typeof CardNav).toBe("function")
  })
})

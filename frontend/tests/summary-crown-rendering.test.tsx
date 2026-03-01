import { describe, expect, it } from "vitest"

import {
  CROWN_ICON_ALT,
  CROWN_ICON_SRC,
  isPlayerCrowned,
  showCrownForSummaryMode,
  toCrownedPlayerSet,
} from "../src/features/summary/crownWinners"

describe("Summary crown rendering helpers", () => {
  it("keeps crown icon constants stable", () => {
    expect(CROWN_ICON_SRC).toBe("/images/icons/crown-color.png")
    expect(CROWN_ICON_ALT).toBe("Crowned winner")
  })

  it("returns crowned membership from payload ids", () => {
    const crowned = toCrownedPlayerSet(["p1", "p2"])
    expect(isPlayerCrowned(crowned, "p1")).toBe(true)
    expect(isPlayerCrowned(crowned, "p3")).toBe(false)
  })

  it("disables crown display for progress summaries", () => {
    expect(showCrownForSummaryMode("progress")).toBe(false)
    expect(showCrownForSummaryMode("final")).toBe(true)
  })
})

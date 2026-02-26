import { describe, expect, it } from "vitest"

import { getMexicanoSideScoreOptions, toMexicanoPayload } from "../src/features/run-event/resultEntry"

describe("RunEvent Mexicano modal options", () => {
  it("exposes exactly 24 clickable side-score alternatives", () => {
    const options = getMexicanoSideScoreOptions()
    expect(options).toHaveLength(24)
    expect(options[0]).toBe(1)
    expect(options[23]).toBe(24)
  })

  it("assigns opposing side score as 24 minus selected score", () => {
    expect(toMexicanoPayload(1, 17)).toEqual({ mode: "Mexicano", team1Score: 17, team2Score: 7 })
    expect(toMexicanoPayload(2, 17)).toEqual({ mode: "Mexicano", team1Score: 7, team2Score: 17 })
  })
})

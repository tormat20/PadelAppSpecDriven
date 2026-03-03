import { describe, expect, it } from "vitest"

import { getStartStep } from "../src/pages/CreateEvent"
import { canStartEvent } from "../src/pages/PreviewEvent"

describe("preview edit event flow", () => {
  it("derives start step from lifecycle status", () => {
    // No lifecycle (new event) → step 0
    expect(getStartStep(undefined)).toBe(0)
    // Planned slot (setup only) → step 1 (Roster)
    expect(getStartStep("planned")).toBe(1)
    // Ready (setup + roster done) → step 2 (Confirm)
    expect(getStartStep("ready")).toBe(2)
  })

  it("gates start event by readiness", () => {
    expect(canStartEvent({ lifecycleStatus: "planned", setupStatus: "planned", status: "Lobby" })).toBe(false)
    expect(canStartEvent({ lifecycleStatus: "ongoing", setupStatus: "ready", status: "Running" })).toBe(false)
    expect(canStartEvent({ lifecycleStatus: "ready", setupStatus: "ready", status: "Lobby" })).toBe(true)
  })
})

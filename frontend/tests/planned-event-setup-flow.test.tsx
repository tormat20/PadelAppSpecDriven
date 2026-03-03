import { describe, expect, it } from "vitest"

import { canStartEvent } from "../src/pages/PreviewEvent"

describe("planned event setup flow helpers", () => {
  it("allows start only for ready events", () => {
    expect(canStartEvent({ lifecycleStatus: "ready", setupStatus: "ready", status: "Lobby" })).toBe(true)
    expect(canStartEvent({ lifecycleStatus: "ongoing", setupStatus: "ready", status: "Running" })).toBe(false)
    expect(canStartEvent({ lifecycleStatus: "planned", setupStatus: "planned", status: "Lobby" })).toBe(false)
  })
})

import { describe, expect, it } from "vitest"

import { createEvent, finishEvent, getCurrentRound, getEvent, nextRound, searchPlayers, startEvent } from "./api"

describe("api exports", () => {
  it("exposes request functions", () => {
    expect(typeof searchPlayers).toBe("function")
    expect(typeof createEvent).toBe("function")
    expect(typeof getEvent).toBe("function")
    expect(typeof startEvent).toBe("function")
    expect(typeof getCurrentRound).toBe("function")
    expect(typeof nextRound).toBe("function")
    expect(typeof finishEvent).toBe("function")
  })
})

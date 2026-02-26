import { describe, expect, it } from "vitest"

import { toAmericanoPayload, toBeatTheBoxPayload } from "../src/features/run-event/resultEntry"

describe("RunEvent result modal mode options", () => {
  it("maps Americano side-relative win/loss selections", () => {
    expect(toAmericanoPayload(1, "Win")).toEqual({ mode: "Americano", winningTeam: 1 })
    expect(toAmericanoPayload(1, "Loss")).toEqual({ mode: "Americano", winningTeam: 2 })
  })

  it("maps BeatTheBox side-relative options including draw", () => {
    expect(toBeatTheBoxPayload(2, "Win")).toEqual({ mode: "BeatTheBox", outcome: "Team2Win" })
    expect(toBeatTheBoxPayload(2, "Loss")).toEqual({ mode: "BeatTheBox", outcome: "Team1Win" })
    expect(toBeatTheBoxPayload(2, "Draw")).toEqual({ mode: "BeatTheBox", outcome: "Draw" })
  })
})

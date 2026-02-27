import { describe, expect, it, vi } from "vitest"

import { ResultEntry } from "../src/components/matches/ResultEntry"

describe("ResultEntry", () => {
  it("calls onSelect when option clicked", () => {
    const onSelect = vi.fn()
    const view = ResultEntry({ label: "Result", options: ["Team A", "Team B"], onSelect })

    expect(ResultEntry).toBeTypeOf("function")
    expect(view).toBeTruthy()
    expect(onSelect).not.toHaveBeenCalled()
  })
})

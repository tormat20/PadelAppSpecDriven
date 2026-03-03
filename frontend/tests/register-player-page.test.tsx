import { describe, expect, it } from "vitest"

import { getRegisterPlayerError } from "../src/pages/RegisterPlayer"

describe("getRegisterPlayerError", () => {
  it("returns empty-name error for an empty string", () => {
    expect(getRegisterPlayerError("", [])).toBe("Player name cannot be empty.")
  })

  it("returns empty-name error for whitespace-only input", () => {
    expect(getRegisterPlayerError("   ", [])).toBe("Player name cannot be empty.")
  })

  it("returns duplicate error when name matches existing player (exact case)", () => {
    const catalog = [{ id: "1", displayName: "Alice" }]
    expect(getRegisterPlayerError("Alice", catalog)).toBe("A player named 'Alice' already exists.")
  })

  it("returns duplicate error when name matches existing player (case-insensitive)", () => {
    const catalog = [{ id: "1", displayName: "Alice" }]
    expect(getRegisterPlayerError("alice", catalog)).toBe("A player named 'alice' already exists.")
  })

  it("returns empty string when name is unique", () => {
    const catalog = [{ id: "1", displayName: "Alice" }]
    expect(getRegisterPlayerError("Bob", catalog)).toBe("")
  })

  it("returns empty string when catalog is empty", () => {
    expect(getRegisterPlayerError("Bob", [])).toBe("")
  })
})

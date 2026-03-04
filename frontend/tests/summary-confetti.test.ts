import { afterEach, describe, expect, it, vi, beforeEach } from "vitest"

// Mock canvas-confetti before importing the module under test
vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}))

import { scheduleConfettiBursts } from "../src/features/summary/confetti"

describe("scheduleConfettiBursts", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns a cleanup function", () => {
    const cleanup = scheduleConfettiBursts()
    expect(typeof cleanup).toBe("function")
    cleanup()
  })

  it("calling cleanup before bursts complete does not throw", () => {
    const cleanup = scheduleConfettiBursts()
    expect(() => cleanup()).not.toThrow()
  })

  it("cleanup can be called multiple times without error", () => {
    const cleanup = scheduleConfettiBursts()
    expect(() => {
      cleanup()
      cleanup()
    }).not.toThrow()
  })

  it("calls confetti 10 times when all timeouts fire", async () => {
    const confetti = (await import("canvas-confetti")).default as unknown as ReturnType<typeof vi.fn>
    confetti.mockClear()

    scheduleConfettiBursts()
    vi.runAllTimers()

    expect(confetti).toHaveBeenCalledTimes(10)
  })

  it("does not call confetti if cleanup is invoked before timers run", async () => {
    const confetti = (await import("canvas-confetti")).default as unknown as ReturnType<typeof vi.fn>
    confetti.mockClear()

    const cleanup = scheduleConfettiBursts()
    cleanup()
    vi.runAllTimers()

    expect(confetti).toHaveBeenCalledTimes(0)
  })
})

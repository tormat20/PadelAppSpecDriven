import { describe, expect, it } from "vitest"

import { getRoundStepperProps } from "../src/pages/RunEvent"

describe("getRoundStepperProps", () => {
  it("returns correct steps and currentStep for round 1 of 4", () => {
    const result = getRoundStepperProps(4, 1)
    expect(result).toEqual({
      steps: [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }],
      currentStep: 0,
    })
  })

  it("returns correct steps and currentStep for round 3 of 4", () => {
    const result = getRoundStepperProps(4, 3)
    expect(result).toEqual({
      steps: [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }],
      currentStep: 2,
    })
  })

  it("returns correct result for a single-round event", () => {
    const result = getRoundStepperProps(1, 1)
    expect(result).toEqual({
      steps: [{ label: "1" }],
      currentStep: 0,
    })
  })

  it("returns null when totalRounds is 0", () => {
    expect(getRoundStepperProps(0, 1)).toBeNull()
  })

  it("returns null when totalRounds is negative", () => {
    expect(getRoundStepperProps(-1, 1)).toBeNull()
  })

  it("clamps roundNumber to 1 when roundNumber is 0", () => {
    const result = getRoundStepperProps(4, 0)
    expect(result).toEqual({
      steps: [{ label: "1" }, { label: "2" }, { label: "3" }, { label: "4" }],
      currentStep: 0,
    })
  })
})

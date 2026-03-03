import { describe, expect, it } from "vitest"

import { getStepState } from "../src/components/stepper/Stepper"

describe("Stepper step state logic", () => {
  it("marks steps before currentStep as complete", () => {
    expect(getStepState(0, 2)).toBe("complete")
    expect(getStepState(1, 2)).toBe("complete")
  })

  it("marks the current step as active", () => {
    expect(getStepState(0, 0)).toBe("active")
    expect(getStepState(1, 1)).toBe("active")
    expect(getStepState(2, 2)).toBe("active")
  })

  it("marks steps after currentStep as inactive", () => {
    expect(getStepState(1, 0)).toBe("inactive")
    expect(getStepState(2, 0)).toBe("inactive")
    expect(getStepState(2, 1)).toBe("inactive")
  })

  it("works at the first step boundary (currentStep=0)", () => {
    expect(getStepState(0, 0)).toBe("active")
    expect(getStepState(1, 0)).toBe("inactive")
    expect(getStepState(2, 0)).toBe("inactive")
  })

  it("works at the last step boundary (currentStep=2 of 3)", () => {
    expect(getStepState(0, 2)).toBe("complete")
    expect(getStepState(1, 2)).toBe("complete")
    expect(getStepState(2, 2)).toBe("active")
  })
})

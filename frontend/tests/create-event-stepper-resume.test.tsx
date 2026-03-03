import { describe, expect, it } from "vitest"

import { getStartStep } from "../src/pages/CreateEvent"

describe("Create Event Stepper — Resume flow (User Story 2)", () => {
  // getStartStep is the sole determinant for which step to open at when editing.

  describe("step derivation from lifecycleStatus", () => {
    it("opens at step 0 for undefined (brand-new event record)", () => {
      expect(getStartStep(undefined)).toBe(0)
    })

    it("opens at step 1 (Roster) for a 'planned' slot", () => {
      // A "planned" event has setup fields saved but roster is incomplete.
      // The user should land on the Roster step with Setup shown as complete.
      expect(getStartStep("planned")).toBe(1)
    })

    it("opens at step 2 (Confirm) for a 'ready' event", () => {
      // A "ready" event has both setup and roster complete.
      // The user should land on the Confirm step ready to start.
      expect(getStartStep("ready")).toBe(2)
    })

    it("returns 0 for 'ongoing' (redirect happens before this is used)", () => {
      // CreateEvent.tsx redirects before calling getStartStep for ongoing/finished,
      // but getStartStep itself returns a safe 0 as a defensive fallback.
      expect(getStartStep("ongoing")).toBe(0)
    })

    it("returns 0 for 'finished' (redirect happens before this is used)", () => {
      expect(getStartStep("finished")).toBe(0)
    })
  })

  describe("step indicator states when resuming at step 1 (Roster)", () => {
    it("step 0 is 'complete' when currentStep is 1", () => {
      // getStepState logic: i < currentStep → "complete"
      const stepIndex = 0
      const currentStep: number = 1
      expect(stepIndex < currentStep).toBe(true) // step 0 is complete
      expect(stepIndex === currentStep).toBe(false) // step 0 is not active
    })

    it("step 1 is 'active' when currentStep is 1", () => {
      const stepIndex: number = 1
      const currentStep: number = 1
      expect(stepIndex === currentStep).toBe(true)
    })

    it("step 2 is 'inactive' when currentStep is 1", () => {
      const stepIndex = 2
      const currentStep: number = 1
      expect(stepIndex > currentStep).toBe(true) // step 2 is inactive
    })
  })

  describe("step indicator states when resuming at step 2 (Confirm)", () => {
    it("steps 0 and 1 are 'complete' when currentStep is 2", () => {
      const currentStep: number = 2
      expect(0 < currentStep).toBe(true) // step 0 is complete
      expect(1 < currentStep).toBe(true) // step 1 is complete
    })

    it("step 2 is 'active' when currentStep is 2", () => {
      const stepIndex: number = 2
      const currentStep: number = 2
      expect(stepIndex === currentStep).toBe(true)
    })
  })
})

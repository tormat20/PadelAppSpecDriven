import { AnimatePresence, motion } from "motion/react"
import React from "react"

import "./stepper.css"

/** Returns the visual state of a step indicator given its index and the current step. */
export function getStepState(stepIndex: number, currentStep: number): "inactive" | "active" | "complete" {
  if (stepIndex < currentStep) return "complete"
  if (stepIndex === currentStep) return "active"
  return "inactive"
}

export type StepDefinition = {
  /** Short label displayed below the step circle, e.g. "Setup" */
  label: string
}

export type StepperProps = {
  /**
   * Ordered list of step definitions. Length determines total step count.
   * Example: [{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]
   */
  steps: StepDefinition[]

  /**
   * Zero-indexed current step. Must be in range [0, steps.length - 1].
   */
  currentStep: number

  /**
   * Slide direction for the transition animation.
   *   1 = forward (new content enters from right, old exits to left)
   *  -1 = backward (new content enters from left, old exits to right)
   */
  direction: number

  /**
   * Called when the user clicks a completed step indicator.
   * Only fires for steps with index < currentStep.
   */
  onStepClick?: (stepIndex: number) => void

  /**
   * The content for the currently active step.
   */
  children: React.ReactNode
}

// Directional slide variants — entering slides in from the correct side,
// exiting slides out to the correct side based on direction prop.
const panelVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "40%" : "-40%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-40%" : "40%",
    opacity: 0,
  }),
}

const panelTransition = {
  duration: 0.4,
  ease: "easeInOut" as const,
}

export default function Stepper({ steps, currentStep, direction, onStepClick, children }: StepperProps) {
  return (
    <div className="stepper">
      {/* Step indicator bar */}
      <div className="stepper-header">
        <ol className="stepper-steps" role="list">
          {steps.map((step, i) => {
            const state = i < currentStep ? "complete" : i === currentStep ? "active" : "inactive"
            const isClickable = state === "complete" && onStepClick != null
            const humanIndex = i + 1
            const ariaLabel = `Step ${humanIndex}: ${step.label} – ${state}`

            return (
              <React.Fragment key={step.label}>
                {i > 0 && (
                  <li className="stepper-connector" role="presentation" aria-hidden="true" />
                )}
                <li className="stepper-step" role="listitem">
                  {isClickable ? (
                    <button
                      type="button"
                      className="stepper-circle"
                      data-state={state}
                      aria-label={ariaLabel}
                      onClick={() => onStepClick(i)}
                    >
                      {/* Checkmark SVG for complete state */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : (
                    <span
                      className="stepper-circle"
                      data-state={state}
                      aria-label={ariaLabel}
                      role="img"
                    >
                      {state === "complete" ? (
                        /* Checkmark SVG for complete-but-not-clickable (shouldn't happen, but defensive) */
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 7L5.5 10L11.5 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : state === "active" ? (
                        /* Active center dot */
                        <span className="stepper-active-dot" aria-hidden="true" />
                      ) : (
                        /* Inactive: show step number */
                        humanIndex
                      )}
                    </span>
                  )}
                  <span className="stepper-label" data-state={state}>
                    {step.label}
                  </span>
                </li>
              </React.Fragment>
            )
          })}
        </ol>
      </div>

      {/* Animated step content */}
      <div className="stepper-content" aria-live="polite">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            className="stepper-panel"
            custom={direction}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={panelTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

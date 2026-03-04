/**
 * Animations toggle — pure helpers (exported for unit testing) + React component.
 *
 * Mechanism: sets `data-animations="off"` on <html> to disable animations,
 * removes the attribute to re-enable. motion.css and the Prism/Aurora RAF
 * loops all react to this attribute.
 *
 * Persistence: localStorage key "animations", values "on" | "off".
 * Default: "on" (animations enabled).
 */

import { useCallback, useEffect, useState } from "react"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

export type AnimationsPref = "on" | "off"

const STORAGE_KEY = "animations"

/** Read the initial animations preference from storage. Defaults to "on". */
export function getInitialAnimations(storage: Storage): AnimationsPref {
  const stored = storage.getItem(STORAGE_KEY)
  if (stored === "on" || stored === "off") return stored
  return "on"
}

/** Apply an animations preference to the given HTML element (typically document.documentElement). */
export function applyAnimations(pref: AnimationsPref, root: HTMLElement): void {
  if (pref === "off") {
    root.dataset.animations = "off"
  } else {
    delete root.dataset.animations
  }
}

/** Persist the chosen animations preference to storage. */
export function persistAnimations(pref: AnimationsPref, storage: Storage): void {
  storage.setItem(STORAGE_KEY, pref)
}

const PLAY_ICON = (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const PAUSE_ICON = (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
  >
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

export function AnimationsToggle() {
  const [pref, setPref] = useState<AnimationsPref>(() =>
    typeof window !== "undefined"
      ? getInitialAnimations(window.localStorage)
      : "on",
  )

  // Apply preference to DOM on mount and whenever pref changes
  useEffect(() => {
    applyAnimations(pref, document.documentElement)
    persistAnimations(pref, window.localStorage)
  }, [pref])

  const toggle = useCallback(() => {
    setPref((p) => (p === "on" ? "off" : "on"))
  }, [])

  const isOn = pref === "on"

  return (
    <button
      aria-label={isOn ? "Disable animations" : "Enable animations"}
      aria-pressed={!isOn}
      className={withInteractiveSurface("theme-toggle-btn")}
      onClick={toggle}
      type="button"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-label">
        {isOn ? PLAY_ICON : PAUSE_ICON}
        {isOn ? "Motion" : "Paused"}
      </span>
    </button>
  )
}

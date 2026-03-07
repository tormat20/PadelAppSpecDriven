/**
 * ThemeAnimationToggle — a single pill button containing both the dark-mode
 * toggle and the motion toggle side-by-side, separated by a divider.
 *
 * Replaces the two separate <ThemeToggle> and <AnimationsToggle> components
 * in the nav controls slot. Those components remain unchanged for unit tests.
 */

import { useCallback, useEffect, useState } from "react"

import {
  type AnimationsPref,
  applyAnimations,
  getInitialAnimations,
  persistAnimations,
} from "./AnimationsToggle"
import {
  type Theme,
  applyTheme,
  getInitialTheme,
  persistTheme,
} from "./ThemeToggle"

// ── Icons ─────────────────────────────────────────────────────────────────────

const SUN_ICON = (
  <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" x2="12" y1="1" y2="3" />
    <line x1="12" x2="12" y1="21" y2="23" />
    <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
    <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
    <line x1="1" x2="3" y1="12" y2="12" />
    <line x1="21" x2="23" y1="12" y2="12" />
    <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
    <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
  </svg>
)

const MOON_ICON = (
  <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const PLAY_ICON = (
  <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const PAUSE_ICON = (
  <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

export function ThemeAnimationToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== "undefined" ? getInitialTheme(window.localStorage) : "light",
  )
  const [pref, setPref] = useState<AnimationsPref>(() =>
    typeof window !== "undefined" ? getInitialAnimations(window.localStorage) : "on",
  )

  useEffect(() => {
    applyTheme(theme, document.documentElement)
    persistTheme(theme, window.localStorage)
  }, [theme])

  useEffect(() => {
    applyAnimations(pref, document.documentElement)
    persistAnimations(pref, window.localStorage)
  }, [pref])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  const toggleMotion = useCallback(() => {
    setPref((p) => (p === "on" ? "off" : "on"))
  }, [])

  const isDark = theme === "dark"
  const isMotionOn = pref === "on"

  return (
    <div className="theme-anim-toggle" role="group" aria-label="Display preferences">
      {/* Dark mode half */}
      <button
        type="button"
        className="theme-anim-toggle__half"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        onClick={toggleTheme}
      >
        <span className={`theme-anim-track${isDark ? " theme-anim-track--on" : ""}`}>
          <span className={`theme-anim-thumb${isDark ? " theme-anim-thumb--on" : ""}`} />
        </span>
        <span className="theme-anim-label">
          {isDark ? MOON_ICON : SUN_ICON}
          <span>{isDark ? "Dark" : "Light"}</span>
        </span>
      </button>

      {/* Divider */}
      <span className="theme-anim-divider" aria-hidden="true" />

      {/* Motion half */}
      <button
        type="button"
        className="theme-anim-toggle__half"
        aria-label={isMotionOn ? "Disable animations" : "Enable animations"}
        aria-pressed={!isMotionOn}
        onClick={toggleMotion}
      >
        <span className={`theme-anim-track theme-anim-track--motion${isMotionOn ? " theme-anim-track--on" : ""}`}>
          <span className={`theme-anim-thumb${isMotionOn ? " theme-anim-thumb--on" : ""}`} />
        </span>
        <span className="theme-anim-label">
          {isMotionOn ? PLAY_ICON : PAUSE_ICON}
          <span>Motion</span>
        </span>
      </button>
    </div>
  )
}

/**
 * Theme toggle — pure helpers (exported for unit testing) + React component.
 *
 * Mechanism: sets `data-theme="dark"` on <html> for dark mode, removes the
 * attribute for light mode. CSS custom-property overrides in tokens.css handle
 * every visual change automatically.
 *
 * Persistence: localStorage key "theme", values "dark" | "light".
 * Default: follows OS prefers-color-scheme when no stored preference.
 */

import { useCallback, useEffect, useState } from "react"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

/** Read the initial theme from storage, falling back to OS preference. */
export function getInitialTheme(storage: Storage): Theme {
  const stored = storage.getItem(STORAGE_KEY)
  if (stored === "dark" || stored === "light") return stored
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark"
  }
  return "light"
}

/** Apply a theme to the given HTML element (typically document.documentElement). */
export function applyTheme(theme: Theme, root: HTMLElement): void {
  if (theme === "dark") {
    root.dataset.theme = "dark"
  } else {
    delete root.dataset.theme
  }
}

/** Persist the chosen theme to storage. */
export function persistTheme(theme: Theme, storage: Storage): void {
  storage.setItem(STORAGE_KEY, theme)
}

const SUN_ICON = (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== "undefined"
      ? getInitialTheme(window.localStorage)
      : "light",
  )

  // Apply theme to DOM on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme, document.documentElement)
    persistTheme(theme, window.localStorage)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"))
  }, [])

  const isDark = theme === "dark"

  return (
    <button
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={withInteractiveSurface("theme-toggle-btn")}
      onClick={toggle}
      type="button"
    >
      <span className="theme-toggle-track">
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-label">
        {isDark ? MOON_ICON : SUN_ICON}
        {isDark ? "Dark" : "Light"}
      </span>
    </button>
  )
}

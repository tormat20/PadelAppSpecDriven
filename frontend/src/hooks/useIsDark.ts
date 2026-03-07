/**
 * useIsDark — shared hook that reads the current theme and watches for
 * live changes via a MutationObserver on <html data-theme>.
 *
 * Used by AppShell and auth pages so both can render the correct
 * Aurora (dark) or Prism (light) animated background.
 */

import { useEffect, useState } from "react"
import { getInitialTheme } from "../components/theme/ThemeToggle"

export function useIsDark(): boolean {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return getInitialTheme(window.localStorage) === "dark"
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.dataset.theme === "dark")
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}

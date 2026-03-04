import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"

import { Aurora } from "../components/backgrounds/Aurora"
import { Prism } from "../components/backgrounds/Prism"
import { LogoButton } from "../components/branding/LogoButton"
import { usePointerProximity } from "../components/interaction/usePointerProximity"
import { CardNav } from "../components/nav/CardNav"
import { AnimationsToggle } from "../components/theme/AnimationsToggle"
import { ThemeToggle, getInitialTheme } from "../components/theme/ThemeToggle"

export function AppShell() {
  const proximity = usePointerProximity()

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return getInitialTheme(window.localStorage) === "dark"
  })

  // Keep isDark in sync with data-theme attribute mutations (driven by ThemeToggle)
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

  return (
    <div
      className="app-shell"
      onMouseMoveCapture={proximity.onMouseMoveCapture}
      onMouseOutCapture={proximity.onMouseOutCapture}
    >
      {isDark ? (
        <Aurora
          colorStops={["#f6f5f4", "#1c71d8", "#9a9996"]}
          blend={0.5}
          amplitude={1.0}
          speed={1.2}
        />
      ) : (
        <Prism
          animationType="rotate"
          timeScale={0.35}
          height={3.5}
          baseWidth={4.7}
          scale={3.6}
          hueShift={0}
          colorFrequency={0.95}
          noise={0}
          glow={1}
        />
      )}
      <CardNav
        logo={<LogoButton />}
        controls={<><ThemeToggle /><AnimationsToggle /></>}
      />
      <main className="app-main shell-content">
        <Outlet />
      </main>
    </div>
  )
}

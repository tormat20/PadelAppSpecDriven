import { Outlet } from "react-router-dom"

import { Prism } from "../components/backgrounds/Prism"
import { LogoButton } from "../components/branding/LogoButton"
import { usePointerProximity } from "../components/interaction/usePointerProximity"

export const TOP_NAV_ARIA_LABEL = "Primary placeholder navigation"

export function AppShell() {
  const proximity = usePointerProximity()

  return (
    <div
      className="app-shell"
      onMouseMoveCapture={proximity.onMouseMoveCapture}
      onMouseOutCapture={proximity.onMouseOutCapture}
    >
      <Prism
        animationType="rotate"
        timeScale={0.5}
        height={3.5}
        baseWidth={4.7}
        scale={3.6}
        hueShift={0}
        colorFrequency={0.95}
        noise={0}
        glow={1}
      />
      <nav className="app-top-nav" aria-label={TOP_NAV_ARIA_LABEL}>
        <div className="shell-content app-top-nav-inner">
          <LogoButton />
          <div className="app-top-nav-placeholder" aria-hidden="true" />
        </div>
      </nav>
      <main className="app-main shell-content">
        <Outlet />
      </main>
    </div>
  )
}

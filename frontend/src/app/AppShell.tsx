import { Outlet } from "react-router-dom"

import { Aurora } from "../components/backgrounds/Aurora"
import { Prism } from "../components/backgrounds/Prism"
import { LogoButton } from "../components/branding/LogoButton"
import { usePointerProximity } from "../components/interaction/usePointerProximity"
import { CardNav } from "../components/nav/CardNav"
import { UserMenu } from "../components/nav/UserMenu"
import { ThemeAnimationToggle } from "../components/theme/ThemeAnimationToggle"
import { useIsDark } from "../hooks/useIsDark"

export function AppShell() {
  const proximity = usePointerProximity()
  const isDark = useIsDark()

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
        controls={
          <>
            <ThemeAnimationToggle />
            <UserMenu />
          </>
        }
      />
      <main className="app-main shell-content">
        <Outlet />
      </main>
    </div>
  )
}

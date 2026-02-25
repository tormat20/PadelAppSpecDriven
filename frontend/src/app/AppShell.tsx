import { Outlet } from "react-router-dom"

import { LightRaysBackground } from "../components/backgrounds/LightRaysBackground"
import { LogoButton } from "../components/branding/LogoButton"

export function AppShell() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <LightRaysBackground />
      <header style={{ padding: 16, position: "relative", zIndex: 1 }}>
        <LogoButton />
      </header>
      <main style={{ padding: 16, position: "relative", zIndex: 1 }}>
        <Outlet />
      </main>
    </div>
  )
}

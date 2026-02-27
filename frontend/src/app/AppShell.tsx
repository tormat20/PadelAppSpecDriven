import { Outlet } from "react-router-dom"

import { LightRaysBackground } from "../components/backgrounds/LightRaysBackground"
import { LogoButton } from "../components/branding/LogoButton"

export function AppShell() {
  return (
    <div className="app-shell">
      <LightRaysBackground />
      <header className="app-header shell-content">
        <LogoButton />
        <span className="status-chip">Host workflow studio</span>
      </header>
      <main className="app-main shell-content">
        <Outlet />
      </main>
    </div>
  )
}

import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

export const MOLNDAL_LOGO_SRC = "/images/logos/Molndal-padel-bg-removed.png"
export const LOGO_BUTTON_ARIA_LABEL = "Go home"

export function shouldRenderLogoText(): boolean {
  return false
}

export function LogoButton() {
  const navigate = useNavigate()
  const [showFallback, setShowFallback] = useState(false)

  return (
    <button className={withInteractiveSurface("logo-button")} onClick={() => navigate("/")} aria-label={LOGO_BUTTON_ARIA_LABEL}>
      <span className="logo-mark" aria-hidden="true">
        {showFallback ? (
          <span className="logo-mark-fallback">MP</span>
        ) : (
          <img
            className="logo-mark-image"
            src={MOLNDAL_LOGO_SRC}
            alt=""
            onError={() => setShowFallback(true)}
          />
        )}
      </span>
      {shouldRenderLogoText() ? <span className="logo-text">Molndal Padel</span> : null}
    </button>
  )
}

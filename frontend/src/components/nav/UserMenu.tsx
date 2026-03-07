/**
 * UserMenu — shows the signed-in user's email (+ "(Admin)" badge if admin)
 * as a clickable pill. Clicking opens a small dropdown with:
 *   1. Settings  → /account-settings
 *   2. Sign out  → clears auth + redirects to /login
 *
 * Closes on outside click or Escape key.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../contexts/AuthContext"

const SETTINGS_ICON = (
  <svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

const SIGNOUT_ICON = (
  <svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const CHEVRON_ICON = (
  <svg aria-hidden="true" fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="12">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export function UserMenu() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)

  // Position the fixed dropdown below and aligned to the right of the pill
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    })
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  if (!user) return null

  function handleSettings() {
    setOpen(false)
    navigate("/account-settings")
  }

  function handleSignOut() {
    setOpen(false)
    logout()
    navigate("/login", { replace: true })
  }

  const displayLabel = isAdmin ? `${user.email} (Admin)` : user.email

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className={`user-menu__pill${open ? " user-menu__pill--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayLabel}`}
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {user.email[0].toUpperCase()}
        </span>
        <span className="user-menu__email">{user.email}</span>
        {isAdmin && <span className="user-menu__admin-badge">Admin</span>}
        <span className="user-menu__chevron">{CHEVRON_ICON}</span>
      </button>

      {open && dropdownPos !== null && (
        <div
          className="user-menu__dropdown"
          role="menu"
          style={{ position: "fixed", top: dropdownPos.top, right: dropdownPos.right }}
        >
          <div className="user-menu__dropdown-header">
            <span className="user-menu__dropdown-email">{user.email}</span>
            {isAdmin && <span className="user-menu__dropdown-role">Administrator</span>}
          </div>
          <div className="user-menu__dropdown-divider" />
          <button
            type="button"
            role="menuitem"
            className="user-menu__item"
            onClick={handleSettings}
          >
            {SETTINGS_ICON}
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="user-menu__item user-menu__item--danger"
            onClick={handleSignOut}
          >
            {SIGNOUT_ICON}
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

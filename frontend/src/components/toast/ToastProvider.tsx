import { createContext, useCallback, useContext, useRef, useState } from "react"
import type { ReactNode } from "react"

import "./Toast.css"

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
  exiting: boolean
}

interface ToastAPI {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastAPI | null>(null)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>")
  }
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4000
const EXIT_ANIM_MS = 350

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, type, exiting: false }])

    // After AUTO_DISMISS_MS, mark the toast as exiting (CSS fade-out)
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      )
      // Remove from DOM after the exit animation completes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, EXIT_ANIM_MS)
    }, AUTO_DISMISS_MS)
  }, [])

  const api: ToastAPI = {
    success: useCallback((msg) => addToast(msg, "success"), [addToast]),
    error: useCallback((msg) => addToast(msg, "error"), [addToast]),
    info: useCallback((msg) => addToast(msg, "info"), [addToast]),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast toast--${t.type}${t.exiting ? " toast--exiting" : ""}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * AuthContext — provides current user identity, login/logout helpers.
 *
 * Token storage: localStorage key "auth_token"
 * Flash prevention: isLoading starts true; consumers must wait before rendering
 *   protected content.
 *
 * 401 handling: api.ts fires window Event "auth:logout" whenever the server
 *   returns 401.  AuthProvider listens and calls logout() automatically.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  getStoredToken,
  removeStoredToken,
  setStoredToken,
} from "../lib/api"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "user" | "admin"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

interface AuthContextValue {
  /** Decoded user from the stored JWT, or null when not logged in. */
  user: AuthUser | null
  /** True while the initial token validation is in progress (avoids flash). */
  isLoading: boolean
  /** Call after receiving a token from login/register. */
  login: (token: string) => void
  /** Clear auth state and remove stored token. */
  logout: () => void
  isAdmin: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the JWT payload using the built-in `atob()` — no external library.
 * Returns null if the token is absent, malformed, or expired.
 */
function decodeToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    // Check expiry
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null
    if (!payload.sub || !payload.email || !payload.role) return null
    return { id: payload.sub, email: payload.email, role: payload.role as UserRole }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    removeStoredToken()
    setUser(null)
  }, [])

  const login = useCallback((token: string) => {
    const decoded = decodeToken(token)
    if (decoded) {
      setStoredToken(token)
      setUser(decoded)
    }
  }, [])

  // On mount: attempt to restore session from localStorage
  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      const decoded = decodeToken(token)
      if (decoded) {
        setUser(decoded)
      } else {
        // Token present but expired/invalid — clear it
        removeStoredToken()
      }
    }
    setIsLoading(false)
  }, [])

  // Listen for 401 events fired by api.ts
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener("auth:logout", handler)
    return () => window.removeEventListener("auth:logout", handler)
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}

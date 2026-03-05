/**
 * RequireAdmin — redirect to /login (or show 403) when user is not an admin.
 *
 * Also renders null while isLoading === true for flash prevention.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    // Authenticated but not an admin — send them home
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

/**
 * ProtectedRoute — redirect to /login when the user is not authenticated.
 *
 * Renders null while isLoading === true to prevent the flash of unauthenticated
 * content on initial page load before localStorage has been checked.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Avoid flash: wait for auth state to be resolved from localStorage
  if (isLoading) return null

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}

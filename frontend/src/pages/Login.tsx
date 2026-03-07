/**
 * Login page — standalone full-page layout (no AppShell nav bar).
 * On success: store the token, update AuthContext, and redirect.
 *
 * Shows the animated background (Aurora/Prism), logo, and the
 * combined theme+motion toggle — consistent with the main app shell.
 */
import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Aurora } from "../components/backgrounds/Aurora"
import { Prism } from "../components/backgrounds/Prism"
import { MOLNDAL_LOGO_SRC } from "../components/branding/LogoButton"
import { ThemeAnimationToggle } from "../components/theme/ThemeAnimationToggle"
import { useAuth } from "../contexts/AuthContext"
import { useIsDark } from "../hooks/useIsDark"
import { loginUser } from "../lib/api"

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isDark = useIsDark()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // If already logged in, redirect away
  if (!isLoading && user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const { access_token } = await loginUser(email.trim().toLowerCase(), password)
      login(access_token)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/"
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again."
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Animated background */}
      {isDark ? (
        <Aurora colorStops={["#f6f5f4", "#1c71d8", "#9a9996"]} blend={0.5} amplitude={1.0} speed={1.2} />
      ) : (
        <Prism animationType="rotate" timeScale={0.35} height={3.5} baseWidth={4.7} scale={3.6} hueShift={0} colorFrequency={0.95} noise={0} glow={1} />
      )}

      {/* Top bar: logo left, toggle right */}
      <div className="auth-topbar">
        <img className="auth-topbar__logo" src={MOLNDAL_LOGO_SRC} alt="Padel Host" />
        <ThemeAnimationToggle />
      </div>

      {/* Card */}
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Welcome back to Padel Host</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <label className="auth-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !email || !password}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link className="auth-link" to="/create-account">Create one</Link>
        </p>
      </div>
    </div>
  )
}

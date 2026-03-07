/**
 * CreateAccount page — standalone full-page layout (no AppShell nav bar).
 * Self-signup results in role="user".
 *
 * Shows the animated background (Aurora/Prism), logo, and the
 * combined theme+motion toggle — consistent with the main app shell.
 */
import { useState, type FormEvent } from "react"
import { Link, Navigate, useNavigate } from "react-router-dom"
import { Aurora } from "../components/backgrounds/Aurora"
import { Prism } from "../components/backgrounds/Prism"
import { MOLNDAL_LOGO_SRC } from "../components/branding/LogoButton"
import { ThemeAnimationToggle } from "../components/theme/ThemeAnimationToggle"
import { useAuth } from "../contexts/AuthContext"
import { useIsDark } from "../hooks/useIsDark"
import { registerUser } from "../lib/api"

export default function CreateAccountPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const isDark = useIsDark()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // If already logged in, redirect home
  if (!isLoading && user) {
    return <Navigate to="/" replace />
  }

  function validate(): string | null {
    if (!email || !email.includes("@")) return "Please enter a valid email address."
    if (password.length < 8) return "Password must be at least 8 characters."
    if (password !== confirm) return "Passwords do not match."
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setSubmitting(true)
    try {
      const { access_token } = await registerUser(email.trim().toLowerCase(), password)
      login(access_token)
      navigate("/", { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again."
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join Padel Host</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-label" htmlFor="register-email">Email</label>
          <input
            id="register-email"
            className="auth-input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />

          <label className="auth-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />

          <label className="auth-label" htmlFor="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
          />

          {error && (
            <p className="auth-error" role="alert">{error}</p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={submitting || !email || !password || !confirm}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link className="auth-link" to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

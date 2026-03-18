/**
 * Account Settings — scaffold page.
 *
 * Future home of:
 *  - Court configuration (number of courts, names)
 *  - Admin management
 *  - User preferences
 */

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import ConfirmDialog from "../components/ConfirmDialog"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { resetAllPlayerStats, deleteAllPlayers } from "../lib/api"

type DialogMode = "reset-stats" | "delete-all" | null

export default function AccountSettingsPage() {
  const { user, isAdmin } = useAuth()
  const [confirmDialog, setConfirmDialog] = useState<DialogMode>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")

  async function handleResetStats() {
    setIsSubmitting(true)
    try {
      await resetAllPlayerStats()
      setConfirmDialog(null)
      setStatusMessage("All player stats have been reset.")
    } catch {
      setStatusMessage("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteAll() {
    setIsSubmitting(true)
    try {
      await deleteAllPlayers()
      setConfirmDialog(null)
      setStatusMessage("All players have been removed.")
    } catch {
      setStatusMessage("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">
          {isAdmin
            ? "Manage your account and application settings."
            : "Manage your account preferences."}
        </p>
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">Your Account</h2>
        <div className="settings-field">
          <span className="settings-field-label">Email</span>
          <span className="settings-field-value">{user?.email}</span>
        </div>
        <div className="settings-field">
          <span className="settings-field-label">Role</span>
          <span className="settings-field-value">
            {isAdmin ? (
              <span className="settings-role-badge settings-role-badge--admin">Administrator</span>
            ) : (
              <span className="settings-role-badge">Member</span>
            )}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="settings-section">
          <h2 className="settings-section-title">Court Configuration</h2>
          <p className="settings-coming-soon">
            Court setup — number of courts, court names and availability — coming soon.
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="settings-section">
          <h2 className="settings-section-title">Player Management</h2>
          <p className="settings-section-description">
            Destructive operations — these cannot be undone.
          </p>
          <div className="settings-danger-actions">
            <button
              type="button"
              className={withInteractiveSurface("button-secondary")}
              onClick={() => {
                setStatusMessage("")
                setConfirmDialog("reset-stats")
              }}
            >
              Reset Player Stats
            </button>
            <button
              type="button"
              className={withInteractiveSurface("button--danger")}
              onClick={() => {
                setStatusMessage("")
                setConfirmDialog("delete-all")
              }}
            >
              Remove All Players
            </button>
          </div>
          {statusMessage && (
            <p className="settings-status-message" role="status">
              {statusMessage}
            </p>
          )}
          {confirmDialog === "reset-stats" && (
            <ConfirmDialog
              title="Reset All Player Stats?"
              message="This will clear all stats for every player. Players themselves will not be removed."
              confirmLabel="Yes, reset"
              variant="default"
              isLoading={isSubmitting}
              onConfirm={handleResetStats}
              onCancel={() => setConfirmDialog(null)}
            />
          )}
          {confirmDialog === "delete-all" && (
            <ConfirmDialog
              title="Remove All Players?"
              message="This will permanently delete all players and all associated data. This cannot be undone."
              confirmLabel="Yes, delete all"
              variant="danger"
              isLoading={isSubmitting}
              onConfirm={handleDeleteAll}
              onCancel={() => setConfirmDialog(null)}
            />
          )}
        </div>
      )}

      <div className="settings-section">
        <h2 className="settings-section-title">Preferences</h2>
        <p className="settings-coming-soon">
          Notification and display preferences coming soon.
        </p>
      </div>
    </div>
  )
}

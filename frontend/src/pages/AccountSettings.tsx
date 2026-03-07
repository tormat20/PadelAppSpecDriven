/**
 * Account Settings — scaffold page.
 *
 * Future home of:
 *  - Court configuration (number of courts, names)
 *  - Admin management
 *  - User preferences
 */

import { useAuth } from "../contexts/AuthContext"

export default function AccountSettingsPage() {
  const { user, isAdmin } = useAuth()

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

      <div className="settings-section">
        <h2 className="settings-section-title">Preferences</h2>
        <p className="settings-coming-soon">
          Notification and display preferences coming soon.
        </p>
      </div>
    </div>
  )
}

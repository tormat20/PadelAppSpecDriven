# Feature Specification: Local Auth + Pre-Deploy Foundation

**Feature Branch**: `023-local-auth-pre-deploy`  
**Created**: 2026-03-05  
**Status**: Draft  
**Input**: User description: "Local Auth + Pre-Deploy Foundation: three-tier JWT auth (admin/user/public) built entirely locally before hosting. Admin login, user self-signup, public guest access, first-admin CLI bootstrap, JWT persistence and logout."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Login and Protected Access (Priority: P1)

An admin opens the app, navigates to the login page, and signs in with their email and password. After a successful login they are taken back to where they came from (or to the home page) and can now access all event management and player registration areas. If they enter wrong credentials the login page shows a clear error and they stay on the page. Their session survives a page refresh and they can explicitly log out at any time.

**Why this priority**: Without a working admin login there is no way to safely restrict write operations. This is the foundational security slice that everything else builds on.

**Independent Test**: Can be fully tested by (1) seeding a single admin account via the CLI bootstrap script, (2) visiting `/login`, submitting valid credentials, and confirming redirect to the event management area, (3) refreshing the page and confirming the session is still active, (4) clicking log out and confirming the session is cleared and protected pages redirect back to login.

**Acceptance Scenarios**:

1. **Given** an admin account exists, **When** the admin submits valid credentials on `/login`, **Then** they are redirected to the page they originally tried to reach (or home if no prior route), and the navigation bar shows their identity and a log-out option.
2. **Given** an admin account exists, **When** the admin submits an incorrect password, **Then** the login page displays a clear error message and the admin remains on the login page.
3. **Given** a logged-in admin, **When** they reload the page, **Then** they remain logged in and no re-authentication is required.
4. **Given** a logged-in admin, **When** they click log out, **Then** their session is cleared, they are redirected to the home page, and any previously protected page redirects them to `/login` until they sign in again.
5. **Given** an unauthenticated visitor, **When** they try to access a route reserved for admins (e.g. create event, run event, register player), **Then** they are redirected to `/login`.

---

### User Story 2 - First-Admin Bootstrap (Priority: P1)

On a fresh installation with an empty database, an operator runs a single command-line instruction, providing an email address and password. The system creates the first admin account. Subsequent runs of the same command with the same email update the password; the command is safe to run multiple times.

**Why this priority**: Without a bootstrap mechanism there is no way to create the very first admin, which would leave the admin sections of the app permanently inaccessible. This must be resolved before any other auth story has value.

**Independent Test**: Can be fully tested by (1) starting with a database that has no users, (2) running the bootstrap command with a chosen email and password, (3) confirming the command exits successfully with a confirmation message, (4) logging in with those credentials via the web UI and confirming admin access.

**Acceptance Scenarios**:

1. **Given** an empty users store, **When** the operator runs the bootstrap command with a valid email and password, **Then** the command completes without error and prints a confirmation that the admin account was created.
2. **Given** a bootstrap command that has already been run, **When** the operator runs it again with the same email but a new password, **Then** the password is updated and the command completes without error.
3. **Given** the bootstrap command is run with an invalid email format, **Then** the command exits with a descriptive error and no account is created.
4. **Given** the bootstrap command is run with a password shorter than the minimum length, **Then** the command exits with a descriptive error and no account is created.

---

### User Story 3 - User Self-Signup and Read-Only Access (Priority: P2)

A visitor who wants a personalised experience opens `/create-account`, fills in an email and password, and submits the form. The system creates a regular user account and logs them in immediately. They can now see the events list (read-only, no create/edit controls), individual event summaries, player search, and player stats. They cannot access admin-only areas such as creating or running events or registering new players.

**Why this priority**: Self-signup expands access to the app for non-admin users (e.g. players who want to follow their own stats) without requiring admin involvement. It is lower priority than admin login because the app is still usable without it.

**Independent Test**: Can be fully tested by (1) visiting `/create-account` without being logged in, (2) submitting a new email and password, (3) confirming immediate login and redirect to home, (4) visiting `/events` and confirming the list loads with no create/run controls visible, (5) visiting `/events/create` and confirming redirect to home or a "not authorised" message.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on `/create-account`, **When** they submit a valid new email and password, **Then** an account is created, they are logged in, and they are redirected to the home page.
2. **Given** a self-signup attempt with an email that already exists, **When** the form is submitted, **Then** a clear error message is shown and no duplicate account is created.
3. **Given** a logged-in regular user, **When** they navigate to `/events`, **Then** they see the events list in read-only mode with no button or link to create a new event.
4. **Given** a logged-in regular user, **When** they navigate to `/events/:id/summary`, **Then** they can view the summary page.
5. **Given** a logged-in regular user, **When** they attempt to navigate to `/events/create`, `/events/:id/run`, or `/players/register`, **Then** they are redirected away and cannot perform those actions.
6. **Given** a self-signup attempt with a password below the minimum length, **When** the form is submitted, **Then** a clear inline error is shown and no account is created.

---

### User Story 4 - Public Guest Access (Priority: P1)

A visitor who is not logged in and has no account can use the core read-only experience: the home page with all three leaderboards, the player search page, and individual player stats pages. No login prompt or banner interrupts these pages. The visitor has no access to events, event summaries, or any write operations.

**Why this priority**: Leaderboards and player stats are the public-facing showcase of the app. They must remain freely accessible at all times — restricting them would break the app's core value for casual visitors. This story also guards against regressions from the auth implementation.

**Independent Test**: Can be fully tested by opening the app in a fresh private/incognito browser session (no stored session), visiting `/`, `/players/search`, and `/players/:id/stats`, and confirming all three load fully without any redirect or login prompt.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they visit the home page `/`, **Then** all three leaderboard sections load and display correctly without any login prompt.
2. **Given** an unauthenticated visitor, **When** they visit `/players/search`, **Then** the search page loads and functions correctly.
3. **Given** an unauthenticated visitor, **When** they visit `/players/:id/stats`, **Then** the player stats page loads and displays correctly.
4. **Given** an unauthenticated visitor, **When** they attempt to visit `/events` or any event detail page, **Then** they are redirected to `/login`.
5. **Given** an unauthenticated visitor, **When** they attempt to visit `/players/register`, **Then** they are redirected to `/login`.

---

### User Story 5 - Session Persistence and Logout (Priority: P2)

A logged-in user (admin or regular user) reloads the browser or navigates away and returns. Their session is still active — they do not need to log in again. When they explicitly choose to log out, the session is fully cleared immediately and all protected pages become inaccessible until they log in again.

**Why this priority**: A session that disappears on every page refresh creates a frustrating loop where admins must re-authenticate constantly during event management. This must work reliably but it is lower priority than establishing the auth boundaries themselves.

**Independent Test**: Can be fully tested by logging in as any user, closing and reopening the tab (or navigating away and returning), confirming the session is still active, then clicking log out and confirming access to protected pages is revoked.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** the page is reloaded, **Then** the user is still recognised as logged in and the navigation bar still shows their identity.
2. **Given** a logged-in user, **When** they click log out, **Then** their session token is cleared immediately and the navigation bar returns to the unauthenticated state.
3. **Given** a user who has logged out, **When** they navigate to a previously accessible protected page, **Then** they are redirected to `/login`.
4. **Given** a user session that has expired on the server side (token age exceeds the configured lifetime), **When** the user makes any action that requires authorisation, **Then** they are silently redirected to `/login` with a clear message that their session has ended.

---

### Edge Cases

- What happens when the bootstrap command is run with no arguments? → The command prints usage instructions and exits without creating anything.
- What happens when a user submits the login form while the server is unreachable? → The form shows a generic "Unable to connect" error; no crash or silent failure.
- What happens when two browser tabs are open and the user logs out in one tab? → The other tab's next authenticated request returns an auth error and that tab redirects to `/login`.
- What happens when the email field in signup contains uppercase letters? → Emails are normalised to lowercase before storage; `User@Example.com` and `user@example.com` are treated as the same account.
- What happens when a session token is manually deleted from storage mid-session? → The next page navigation or API call treats the user as unauthenticated and redirects to `/login`.
- What happens when an admin tries to navigate to `/login` while already logged in? → They are redirected away to the home page; the login form is not shown to authenticated users.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Identity and Accounts

- **FR-001**: The system MUST support three access tiers: unauthenticated (public), authenticated regular user, and authenticated admin.
- **FR-002**: The system MUST store user accounts with at minimum: a unique email address, a securely hashed password, and a role (admin or user).
- **FR-003**: Email addresses MUST be treated as case-insensitive and normalised to lowercase at the point of creation and lookup.
- **FR-004**: Passwords MUST be stored using a one-way cryptographic hash; plain-text passwords MUST never be persisted.
- **FR-005**: Passwords MUST enforce a minimum length of 8 characters; the system MUST reject shorter passwords with a clear message.

#### Authentication

- **FR-006**: The system MUST provide a login endpoint that accepts email and password and returns a signed, time-limited session token on success.
- **FR-007**: On successful login the system MUST issue a session token with an expiry of 8 hours.
- **FR-008**: The system MUST reject login attempts with incorrect credentials with a generic error that does not reveal whether the email exists.
- **FR-009**: The system MUST provide a self-registration endpoint that accepts email and password and creates a regular-user account; it MUST reject duplicate emails with a clear error.
- **FR-010**: The system MUST provide an endpoint that returns the current authenticated user's identity (email and role) given a valid session token; it MUST return an auth error for missing or invalid tokens.

#### Authorisation

- **FR-011**: All event write operations (create, update, delete, run, score entry) MUST require an admin session token; requests without a valid admin token MUST be rejected with an authorisation error.
- **FR-012**: The player registration write operation MUST require an admin session token.
- **FR-013**: The events list and individual event summary read operations MUST require any valid session token (admin or user); unauthenticated requests MUST receive an authorisation error.
- **FR-014**: Leaderboard read operations, player search, and player stats MUST remain publicly accessible without any session token.
- **FR-015**: The system MUST reject requests using an expired or malformed session token with an authorisation error distinct from a missing-token error.

#### Frontend Route Guards

- **FR-016**: Unauthenticated visitors MUST be redirected to `/login` when they attempt to navigate to any route that requires a session.
- **FR-017**: Logged-in regular users who attempt to navigate to admin-only routes MUST be redirected away (to home) and MUST NOT see admin controls such as "Create event" or "Run event" buttons.
- **FR-018**: The navigation bar MUST reflect the current auth state: unauthenticated visitors see a "Log in" link; logged-in users see their email and a "Log out" control.
- **FR-019**: The `/login` page MUST redirect already-authenticated users away to the home page.
- **FR-020**: The `/create-account` page MUST redirect already-authenticated users away to the home page.

#### Session Persistence

- **FR-021**: The session token MUST be persisted in the browser so that it survives page refresh and tab closure without requiring re-authentication.
- **FR-022**: Logging out MUST immediately clear the persisted session token and revoke in-memory auth state.
- **FR-023**: When a stored session token is found to be expired or invalid on any authenticated request, the system MUST clear the token and redirect the user to `/login`.

#### Bootstrap

- **FR-024**: The system MUST provide a command-line script that creates or updates an admin account given an email and password; it MUST be safe to run multiple times (idempotent on email).
- **FR-025**: The bootstrap script MUST validate email format and password length before attempting to write to the data store and MUST exit with a descriptive error on invalid input.

#### Environment Configuration

- **FR-026**: The backend MUST read its cross-origin allowed origins from an environment variable with a safe localhost default, so that the same codebase works locally and on any future host without code changes.
- **FR-027**: The frontend MUST read the API base URL from an environment variable with a localhost default, so that the same build artefact can be pointed at any future host by changing a single config value.

### Key Entities

- **User**: Represents an app account (not a padel player). Has a unique identifier, a normalised email address, a hashed password, a role (admin or user), and a creation timestamp. A User MAY correspond to a padel Player but there is no required link between the two entities.
- **Session Token**: A signed, time-limited credential issued to a User on successful login. Contains the user's identifier, email, and role in its payload. Expires after a configurable period (default 8 hours). Not persisted on the server — validity is verified by signature and expiry alone.
- **Access Tier**: One of three levels — Public (no token), User (valid token, role=user), Admin (valid token, role=admin). Each tier is a strict superset of the tier below it in terms of read access.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An admin can complete the full login flow — open login page, enter credentials, land on the event management area — in under 30 seconds from a cold browser start.
- **SC-002**: An unauthenticated visitor can load the home page leaderboards without encountering any login prompt or redirect, in 100% of attempts.
- **SC-003**: A new user can complete self-registration — open create-account page, fill in email and password, land on the home page — in under 60 seconds.
- **SC-004**: A logged-in user's session persists across at least 10 consecutive page reloads without requiring re-authentication.
- **SC-005**: Submitting incorrect login credentials returns a visible error to the user within 3 seconds and does not expose whether the email address exists in the system.
- **SC-006**: The bootstrap CLI command creates a working admin account in under 5 seconds on a local machine with a cold database.
- **SC-007**: All previously working public pages (home, player search, player stats) continue to load and function correctly after the auth layer is introduced — zero regressions in existing public routes.
- **SC-008**: Admin-only routes are inaccessible to both unauthenticated visitors and logged-in regular users — 0% of unauthorised access attempts succeed.
- **SC-009**: The frontend can be pointed at a different API host by changing a single environment variable, with no code changes required.
- **SC-010**: The backend accepts cross-origin requests from a configurable list of origins controlled entirely by environment variable, with no code changes required to add a new allowed origin.

---

## Assumptions

- The app is currently used by a small, trusted group. There is no requirement for rate-limiting login attempts, account lockout, or CAPTCHA in this phase.
- Email uniqueness is the sole identity constraint. Multiple accounts with the same display name are not a concern.
- There is no requirement to verify email addresses in this phase. An account is active immediately on creation.
- The minimum password length of 8 characters is a baseline; additional complexity rules (uppercase, symbols) are not required in this phase.
- Self-registered accounts always receive the `user` role. Role elevation to `admin` is handled exclusively via the CLI bootstrap script in this phase.
- Session tokens are not revocable server-side (no token denylist). Logout is client-side only — the token is discarded from browser storage. This is acceptable for the current low-risk, local-only deployment stage.
- The app has a single admin in practice for now; the multi-admin capability is an architectural provision, not an active user story.

## Out of Scope

- Deployment to any remote server, domain, or cloud environment
- Password reset, forgot-password, or account recovery flows
- Email verification or email sending of any kind
- Admin management UI (listing users, promoting/demoting roles, deleting accounts)
- Token refresh or silent re-authentication (a single 8-hour token is sufficient)
- AWS Cognito, OAuth2, SSO, or any third-party identity provider
- Two-factor authentication
- Audit logging of auth events

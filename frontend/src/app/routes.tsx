import type { RouteObject } from "react-router-dom"

import { ProtectedRoute } from "../components/auth/ProtectedRoute"
import { AppShell } from "./AppShell"
import CreateEventPage from "../pages/CreateEvent"
import CreateAccountPage from "../pages/CreateAccount"
import EventSlotsPage from "../pages/EventSlots"
import HomePage from "../pages/Home"
import LoginPage from "../pages/Login"
import PlayerStatsPage from "../pages/PlayerStats"
import PreviewEventPage from "../pages/PreviewEvent"
import RegisterPlayerPage from "../pages/RegisterPlayer"
import RunEventPage from "../pages/RunEvent"
import SearchPlayerPage from "../pages/SearchPlayer"
import SummaryPage from "../pages/Summary"

export const appRoutes: RouteObject[] = [
  // ── Auth pages — no AppShell, no nav bar ─────────────────────────────────
  { path: "/login", element: <LoginPage /> },
  { path: "/create-account", element: <CreateAccountPage /> },

  // ── App shell (top nav) ──────────────────────────────────────────────────
  {
    path: "/",
    element: <AppShell />,
    children: [
      // Public — accessible without login
      { index: true, element: <HomePage /> },
      { path: "players/search", element: <SearchPlayerPage /> },
      { path: "players/:playerId/stats", element: <PlayerStatsPage /> },

      // Protected — require login (role=user or above)
      {
        element: <ProtectedRoute />,
        children: [
          { path: "events", element: <EventSlotsPage /> },
          { path: "events/create", element: <CreateEventPage /> },
          { path: "events/:eventId/preview", element: <PreviewEventPage /> },
          { path: "events/:eventId/run", element: <RunEventPage /> },
          { path: "events/:eventId/summary", element: <SummaryPage /> },
          { path: "events/run", element: <RunEventPage /> },
          { path: "players/register", element: <RegisterPlayerPage /> },
        ],
      },
    ],
  },
]

import type { RouteObject } from "react-router-dom"

import { AppShell } from "./AppShell"
import CreateEventPage from "../pages/CreateEvent"
import EventSlotsPage from "../pages/EventSlots"
import HomePage from "../pages/Home"
import PlayerStatsPage from "../pages/PlayerStats"
import PreviewEventPage from "../pages/PreviewEvent"
import RegisterPlayerPage from "../pages/RegisterPlayer"
import RunEventPage from "../pages/RunEvent"
import SearchPlayerPage from "../pages/SearchPlayer"
import SummaryPage from "../pages/Summary"

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "events", element: <EventSlotsPage /> },
      { path: "events/create", element: <CreateEventPage /> },
      { path: "events/:eventId/preview", element: <PreviewEventPage /> },
      { path: "events/:eventId/run", element: <RunEventPage /> },
      { path: "events/:eventId/summary", element: <SummaryPage /> },
      { path: "events/run", element: <RunEventPage /> },
      { path: "players/register", element: <RegisterPlayerPage /> },
      { path: "players/search", element: <SearchPlayerPage /> },
      { path: "players/:playerId/stats", element: <PlayerStatsPage /> },
    ],
  },
]

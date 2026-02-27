import type { RouteObject } from "react-router-dom"

import { AppShell } from "./AppShell"
import CreateEventPage from "../pages/CreateEvent"
import HomePage from "../pages/Home"
import PreviewEventPage from "../pages/PreviewEvent"
import RunEventPage from "../pages/RunEvent"
import SummaryPage from "../pages/Summary"

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "events/create", element: <CreateEventPage /> },
      { path: "events/:eventId/preview", element: <PreviewEventPage /> },
      { path: "events/:eventId/run", element: <RunEventPage /> },
      { path: "events/:eventId/summary", element: <SummaryPage /> },
      { path: "events/run", element: <RunEventPage /> },
    ],
  },
]

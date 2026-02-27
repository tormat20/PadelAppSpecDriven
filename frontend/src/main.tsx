import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { router } from "./app/router"
import "./index.css"
import "./styles/tokens.css"
import "./styles/layout.css"
import "./styles/components.css"
import "./styles/motion.css"
import "./styles/accessibility.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

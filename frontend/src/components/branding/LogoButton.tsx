import { useNavigate } from "react-router-dom"

export function LogoButton() {
  const navigate = useNavigate()
  return (
    <button className="logo-button" onClick={() => navigate("/")} aria-label="Go home">
      <span className="logo-mark">P</span>
      <span className="logo-text">Padel Host</span>
    </button>
  )
}

import { useNavigate } from "react-router-dom"

export function LogoButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate("/")}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        border: "none",
        background: "#1a4f80",
        color: "white",
        fontWeight: 700,
        cursor: "pointer",
      }}
      aria-label="Go home"
    >
      P
    </button>
  )
}

export function LightRaysBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 20% 20%, rgba(80,160,255,.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(20,120,200,.16), transparent 40%)",
        zIndex: 0,
      }}
    />
  )
}

import './GlareHover.css'

function hexToRgba(hexColor, alpha) {
  const hex = hexColor.replace('#', '')
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = Number.parseInt(hex[0] + hex[0], 16)
    const g = Number.parseInt(hex[1] + hex[1], 16)
    const b = Number.parseInt(hex[2] + hex[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  return hexColor
}

export default function GlareHover({
  children,
  glareColor = '#ffffff',
  glareOpacity = 0.28,
  glareAngle = -30,
  glareSize = 330,
  transitionDuration = 800,
  playOnce = false,
  className = '',
  style = {},
}) {
  const vars = {
    '--gh-angle': `${glareAngle}deg`,
    '--gh-duration': `${transitionDuration}ms`,
    '--gh-size': `${glareSize}%`,
    '--gh-rgba': hexToRgba(glareColor, glareOpacity),
  }

  return (
    <div
      className={`glare-hover ${playOnce ? 'glare-hover--play-once' : ''} ${className}`.trim()}
      style={{ ...vars, ...style }}
    >
      {children}
    </div>
  )
}

import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

export default function LogoInteractive({ src, alt, onClick }) {
  const logoRef = useRef(null)
  const spotlightRef = useRef(null)

  useEffect(() => {
    const element = logoRef.current
    if (!element) {
      return undefined
    }

    const spotlight = document.createElement('div')
    spotlight.className = 'logo-global-spotlight'
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const handleMouseMove = (event) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      element.style.setProperty('--logo-glow-x', `${(x / rect.width) * 100}%`)
      element.style.setProperty('--logo-glow-y', `${(y / rect.height) * 100}%`)
      element.style.setProperty('--logo-glow-intensity', '1')

      gsap.to(element, {
        x: (x - centerX) * 0.03,
        y: (y - centerY) * 0.03,
        scale: 1.02,
        duration: 0.18,
        ease: 'power2.out',
      })

      gsap.to(spotlight, {
        opacity: 0.7,
        left: event.clientX,
        top: event.clientY,
        duration: 0.12,
        ease: 'power2.out',
      })
    }

    const handleMouseLeave = () => {
      element.style.setProperty('--logo-glow-intensity', '0')
      gsap.to(element, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.25,
        ease: 'power2.out',
      })
      gsap.to(spotlight, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.out',
      })
    }

    const handleClick = (event) => {
      const rect = element.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )

      const ripple = document.createElement('div')
      ripple.className = 'logo-ripple'
      ripple.style.width = `${maxDistance * 2}px`
      ripple.style.height = `${maxDistance * 2}px`
      ripple.style.left = `${x - maxDistance}px`
      ripple.style.top = `${y - maxDistance}px`
      element.appendChild(ripple)

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove(),
        }
      )

      onClick?.()
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('click', handleClick)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('click', handleClick)
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current)
    }
  }, [onClick])

  return (
    <button className="logo-button" type="button" onClick={onClick}>
      <div ref={logoRef} className="logo-interactive logo-border-glow">
        <div className="logo-mark">
          <img className="logo-img" src={src} alt={alt} />
        </div>
      </div>
    </button>
  )
}

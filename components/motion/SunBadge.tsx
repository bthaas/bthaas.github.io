'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'

export function SunBadge() {
  const orbitRef = useRef<HTMLDivElement>(null)

  const releaseSunHit = () => {
    window.dispatchEvent(new CustomEvent('atlas:sun-hit'))
  }

  useGSAP(() => {
    const orbit = orbitRef.current
    if (!orbit || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const handleProgress = (event: Event) => {
      const position = (event as CustomEvent<{
        position?: { x?: number; y?: number }
      }>).detail?.position
      if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') return
      gsap.set(orbit, {
        left: `${((8 + position.x) / 240) * 100}%`,
        top: `${((23 + position.y) / 32) * 100}%`,
      })
    }

    window.addEventListener('atlas:sun-progress', handleProgress)
    return () => window.removeEventListener('atlas:sun-progress', handleProgress)
  }, { scope: orbitRef })

  return (
    <div className="sun-arc sun-badge">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 240 32">
        <path
          className="sun-arc__track"
          data-atlas-sun-path
          d="M8 23 Q120 -5 232 23"
        />
        <g data-atlas-sun>
          <circle className="sun-arc__halo" cx="8" cy="23" r="9" />
          <circle className="sun-arc__disc" cx="8" cy="23" r="6" />
        </g>
      </svg>
      <div ref={orbitRef} className="sun-badge__orbit">
        <button
          className="sun-badge__trigger"
          type="button"
          aria-label="Release the sun spectacle"
          data-atlas-sun-trigger
          onClick={releaseSunHit}
        />
      </div>
    </div>
  )
}

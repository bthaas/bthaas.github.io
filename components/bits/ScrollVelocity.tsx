'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'

import { getKineticBandFrame } from '@/lib/atlas-motion/hero-overdrive'

import './ScrollVelocity.css'

interface AtlasScrollDetail {
  readonly velocity?: number
}

interface ScrollVelocityProps {
  readonly className?: string
  readonly direction?: 1 | -1
  readonly text: string
}

gsap.registerPlugin(useGSAP)

export function ScrollVelocity({
  className = '',
  direction = 1,
  text,
}: ScrollVelocityProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const loop = gsap.fromTo(
      track,
      { xPercent: 0 },
      { duration: 18, ease: 'none', repeat: -1, xPercent: -25 },
    )
    loop.timeScale(direction)
    let skewTween: gsap.core.Tween | null = null
    let speedTween: gsap.core.Tween | null = null

    const handleScroll = (event: Event) => {
      const velocity = (event as CustomEvent<AtlasScrollDetail>).detail?.velocity ?? 0
      const frame = getKineticBandFrame(velocity, direction)
      speedTween?.kill()
      skewTween?.kill()
      speedTween = gsap.to(loop, {
        duration: 0.22,
        ease: 'power2.out',
        overwrite: true,
        timeScale: frame.direction * frame.timeScale,
      })
      skewTween = gsap.to(track, {
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
        skewX: frame.skew,
      })
    }

    window.addEventListener('atlas:scroll', handleScroll)
    return () => {
      window.removeEventListener('atlas:scroll', handleScroll)
      speedTween?.kill()
      skewTween?.kill()
      loop.kill()
    }
  }, { dependencies: [direction], scope: rootRef })

  return (
    <div
      ref={rootRef}
      className={`scroll-velocity ${className}`.trim()}
      aria-hidden="true"
    >
      <div ref={trackRef} className="scroll-velocity__track">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="scroll-velocity__copy" key={index}>{text}</span>
        ))}
      </div>
    </div>
  )
}

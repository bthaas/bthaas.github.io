'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'

import './CircularText.css'

interface CircularTextProps {
  readonly className?: string
  readonly hoverDuration?: number
  readonly spinDuration?: number
  readonly text: string
}

gsap.registerPlugin(useGSAP)

export function CircularText({
  className = '',
  hoverDuration = 4,
  spinDuration = 22,
  text,
}: CircularTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const rotation = gsap.to(root, {
      duration: spinDuration,
      ease: 'none',
      repeat: -1,
      rotation: 360,
    })
    let speedTween: gsap.core.Tween | null = null
    const speedUp = () => {
      speedTween?.kill()
      speedTween = gsap.to(rotation, {
        duration: 0.28,
        ease: 'power2.out',
        timeScale: spinDuration / hoverDuration,
      })
    }
    const settle = () => {
      speedTween?.kill()
      speedTween = gsap.to(rotation, {
        duration: 0.55,
        ease: 'power2.out',
        timeScale: 1,
      })
    }

    root.addEventListener('pointerenter', speedUp)
    root.addEventListener('pointerleave', settle)
    return () => {
      root.removeEventListener('pointerenter', speedUp)
      root.removeEventListener('pointerleave', settle)
      speedTween?.kill()
      rotation.kill()
    }
  }, { dependencies: [hoverDuration, spinDuration], scope: rootRef })

  const letters = Array.from(text)

  return (
    <div
      ref={rootRef}
      className={`circular-text ${className}`.trim()}
      aria-hidden="true"
    >
      {letters.map((letter, index) => (
        <span
          className="circular-text__letter"
          style={{ '--circular-text-angle': `${(360 / letters.length) * index}deg` } as React.CSSProperties}
          key={`${letter}-${index}`}
        >
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </div>
  )
}

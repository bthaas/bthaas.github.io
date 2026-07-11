'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState } from 'react'

import { detectWebGL, shouldRenderWebGL } from '@/lib/client-capabilities'

const HeroScene = dynamic(() => import('./HeroScene').then((module) => module.HeroScene), {
  ssr: false,
})

interface HeroExperienceProps {
  readonly fractureProgressRef: React.MutableRefObject<number>
}

interface BoundaryState {
  readonly failed: boolean
}

class SceneBoundary extends Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function HeroExperience({ fractureProgressRef }: HeroExperienceProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false)
  const [isEngaged, setIsEngaged] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const pointerOriginRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const params = new URLSearchParams(window.location.search)
      const reducedMotion = media.matches || params.get('motion') === 'reduce'
      setCanRenderWebGL(
        shouldRenderWebGL({
          width: window.innerWidth,
          reducedMotion,
          webGLAvailable: detectWebGL(),
        }),
      )
      setShowStats(params.get('stats') === '1')
      if (params.get('stats') === '1') setIsEngaged(true)
    }

    update()
    window.addEventListener('resize', update, { passive: true })
    media.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      media.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const origin = pointerOriginRef.current
      if (!origin) {
        pointerOriginRef.current = { x: event.clientX, y: event.clientY }
        return
      }
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 12) {
        setIsEngaged(true)
        window.removeEventListener('pointermove', handlePointerMove)
      }
    }
    const engage = () => setIsEngaged(true)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', engage, { once: true, passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', engage)
    }
  }, [])

  return (
    <div className="hero-visual" aria-hidden="true">
      <img
        className="hero-fallback"
        src="/assets/icarus-wings-fallback.webp"
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {canRenderWebGL && isEngaged && (
        <div className="hero-canvas">
          <SceneBoundary>
            <HeroScene fractureProgressRef={fractureProgressRef} showStats={showStats} />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}

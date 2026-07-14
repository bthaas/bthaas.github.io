'use client'

import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState } from 'react'

import { detectWebGL, shouldRenderWebGL } from '@/lib/client-capabilities'

export type SectionSceneVariant = 'ruins' | 'stairs' | 'monolith'

const SectionScene = dynamic(() => import('./SectionScene').then((module) => module.SectionScene), {
  ssr: false,
})

interface SectionSceneExperienceProps {
  readonly variant: SectionSceneVariant
  readonly progressRef: React.MutableRefObject<number>
  readonly activeIndex?: number | null
}

interface SceneBoundaryState {
  readonly failed: boolean
}

class SceneBoundary extends Component<React.PropsWithChildren, SceneBoundaryState> {
  state: SceneBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

const fallbackByVariant: Record<SectionSceneVariant, string> = {
  ruins: '/assets/ruins-ring-fallback.webp',
  stairs: '/assets/stair-timeline-fallback.webp',
  monolith: '/assets/monolith-field-fallback.webp',
}

export function SectionSceneExperience({
  variant,
  progressRef,
  activeIndex = null,
}: SectionSceneExperienceProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const params = new URLSearchParams(window.location.search)
      const reducedMotion = media.matches || params.get('motion') === 'reduce'
      setIsMobile(window.innerWidth < 768)
      setCanRenderWebGL(
        shouldRenderWebGL({
          width: window.innerWidth,
          reducedMotion,
          webGLAvailable: detectWebGL(),
        }),
      )
      setShowStats(params.get('stats') === '1')
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
    if (!canRenderWebGL) {
      setIsCanvasReady(false)
      return
    }
    const element = visualRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsCanvasReady(entry.isIntersecting),
      { rootMargin: '35% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [canRenderWebGL])

  return (
    <div
      ref={visualRef}
      className={isCanvasReady ? 'section-scene section-scene-canvas' : 'section-scene'}
      aria-hidden="true"
      data-scene-variant={variant}
    >
      <img className="section-scene-fallback" src={fallbackByVariant[variant]} alt="" />
      {canRenderWebGL && isCanvasReady && (
        <div className="section-scene-canvas-shell">
          <SceneBoundary>
            <SectionScene
              activeIndex={activeIndex}
              isMobile={isMobile}
              progressRef={progressRef}
              showStats={showStats}
              variant={variant}
            />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}

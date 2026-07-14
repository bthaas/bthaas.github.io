'use client'

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

import { detectWebGL, shouldRenderWebGL } from '@/lib/client-capabilities'

export type SectionSceneVariant = 'ruins' | 'stairs' | 'monolith'

export interface SceneAffordancePosition {
  readonly x: number
  readonly y: number
}

const SectionScene = dynamic(() => import('./SectionScene').then((module) => module.SectionScene), {
  ssr: false,
})

interface SectionSceneExperienceProps {
  readonly variant: SectionSceneVariant
  readonly progressRef: React.MutableRefObject<number>
  readonly activeIndex?: number | null
  readonly visitedIndices?: readonly number[]
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

const interactiveCountByVariant: Record<SectionSceneVariant, number> = {
  ruins: 5,
  stairs: 0,
  monolith: 3,
}

function ProjectedAffordance({ position }: { readonly position: SceneAffordancePosition }) {
  const ringRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const ring = ringRef.current
    if (!ring || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    let cleanup: () => void = () => undefined
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return
      const context = gsap.context(() => {
        gsap
          .timeline({ repeat: -1, repeatDelay: 2.8 })
          .fromTo(
            '.scene-affordance-pulse',
            { autoAlpha: 0.72, scale: 0.72 },
            { autoAlpha: 0, scale: 1.55, duration: 1.35, ease: 'power2.out' },
          )
      }, ring)
      cleanup = () => context.revert()
    })
    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <svg
      ref={ringRef}
      aria-hidden="true"
      className="scene-click-affordance"
      style={{ left: position.x, top: position.y }}
      viewBox="0 0 48 48"
    >
      <circle className="scene-affordance-hairline" cx="24" cy="24" r="11" />
      <circle className="scene-affordance-pulse" cx="24" cy="24" r="15" />
      <path d="M24 19V29M19 24H29" />
    </svg>
  )
}

export function SectionSceneExperience({
  variant,
  progressRef,
  activeIndex = null,
  visitedIndices,
}: SectionSceneExperienceProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [affordancePosition, setAffordancePosition] = useState<SceneAffordancePosition | null>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const affordanceIndex = visitedIndices
    ? Array.from({ length: interactiveCountByVariant[variant] }, (_, index) => index).find(
        (index) => !visitedIndices.includes(index),
      ) ?? null
    : null
  const handleAffordancePosition = useCallback((position: SceneAffordancePosition | null) => {
    setAffordancePosition(position)
  }, [])

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
              affordanceIndex={affordanceIndex}
              isMobile={isMobile}
              onAffordancePosition={handleAffordancePosition}
              progressRef={progressRef}
              showStats={showStats}
              variant={variant}
              visitedIndices={visitedIndices ?? []}
            />
          </SceneBoundary>
        </div>
      )}
      {affordanceIndex !== null && affordancePosition && (
        <ProjectedAffordance position={affordancePosition} />
      )}
    </div>
  )
}

'use client'

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

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

function WingLoadingOutline() {
  const loaderRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const loader = loaderRef.current
    const paths = loader?.querySelectorAll('path')
    if (!loader || !paths || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    let cleanup: () => void = () => undefined
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return
      const context = gsap.context(() => {
        gsap
          .timeline({ repeat: -1, repeatDelay: 0.55 })
          .fromTo(
            paths,
            { strokeDasharray: 220, strokeDashoffset: 220, autoAlpha: 0.42 },
            { strokeDashoffset: 0, autoAlpha: 1, duration: 0.78, stagger: 0.06, ease: 'power2.inOut' },
          )
          .to(paths, { autoAlpha: 0.5, duration: 0.45, ease: 'sine.inOut' })
      }, loader)
      cleanup = () => context.revert()
    })
    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <div className="hero-wing-loader">
      <svg ref={loaderRef} aria-hidden="true" viewBox="0 0 240 92">
        <path d="M119 49C94 22 59 12 16 22C45 31 65 46 82 72C95 66 107 58 119 49Z" />
        <path d="M121 49C146 22 181 12 224 22C195 31 175 46 158 72C145 66 133 58 121 49Z" />
        <path d="M25 25C48 28 72 42 91 64M215 25C192 28 168 42 149 64" />
      </svg>
      <span>Assembling the wings</span>
    </div>
  )
}

export function HeroExperience({ fractureProgressRef }: HeroExperienceProps) {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false)
  const [isCanvasReady, setIsCanvasReady] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [isSceneLoaded, setIsSceneLoaded] = useState(false)
  const visualRef = useRef<HTMLDivElement>(null)
  const sceneReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSceneReady = useCallback(() => {
    if (sceneReadyTimerRef.current) globalThis.clearTimeout(sceneReadyTimerRef.current)
    sceneReadyTimerRef.current = globalThis.setTimeout(() => setIsSceneLoaded(true), 1200)
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
    let idleRequest = 0
    let timeout: ReturnType<typeof setTimeout> | undefined

    const mountCanvas = () => {
      if ('requestIdleCallback' in window) {
        idleRequest = window.requestIdleCallback(() => setIsCanvasReady(true), { timeout: 900 })
      } else {
        timeout = globalThis.setTimeout(() => setIsCanvasReady(true), 320)
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          mountCanvas()
          return
        }
        if (idleRequest) window.cancelIdleCallback(idleRequest)
        if (timeout) globalThis.clearTimeout(timeout)
        setIsCanvasReady(false)
      },
      { rootMargin: '35% 0px' },
    )
    observer.observe(element)

    return () => {
      observer.disconnect()
      if (idleRequest) window.cancelIdleCallback(idleRequest)
      if (timeout) globalThis.clearTimeout(timeout)
    }
  }, [canRenderWebGL])

  useEffect(() => {
    if (!isCanvasReady) {
      if (sceneReadyTimerRef.current) globalThis.clearTimeout(sceneReadyTimerRef.current)
      sceneReadyTimerRef.current = null
      setIsSceneLoaded(false)
    }
  }, [isCanvasReady])

  useEffect(
    () => () => {
      if (sceneReadyTimerRef.current) globalThis.clearTimeout(sceneReadyTimerRef.current)
    },
    [],
  )

  return (
    <div
      ref={visualRef}
      className={isCanvasReady ? 'hero-visual hero-visual-canvas' : 'hero-visual'}
      aria-hidden="true"
    >
      <img
        className="hero-fallback"
        src="/assets/icarus-wings-fallback.webp"
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {canRenderWebGL && isCanvasReady && !isSceneLoaded && <WingLoadingOutline />}
      {canRenderWebGL && isCanvasReady && (
        <div className="hero-canvas">
          <SceneBoundary>
            <HeroScene
              fractureProgressRef={fractureProgressRef}
              isMobile={isMobile}
              onReady={handleSceneReady}
              showStats={showStats}
            />
          </SceneBoundary>
        </div>
      )}
    </div>
  )
}

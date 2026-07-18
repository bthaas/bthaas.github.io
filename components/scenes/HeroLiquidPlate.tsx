'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

import { AtlasPicture } from '@/components/portfolio/AtlasPicture'
import { atlasVisuals } from '@/content/editorial-visuals'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const HeroLiquidScene = dynamic(
  () => import('./AtlasWebGLScenes').then((module) => module.HeroLiquidScene),
  { ssr: false },
)

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

export function HeroLiquidPlate() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [canvasReady, setCanvasReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isConstrained, setIsConstrained] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const handleReady = useCallback(() => setCanvasReady(true), [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let firstFrame = 0
    let secondFrame = 0
    let idleHandle = 0
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    const cancelSchedule = () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      window.cancelIdleCallback?.(idleHandle)
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
    }
    const update = () => {
      cancelSchedule()
      const profile = detectWebGLProfile()
      const eligible = shouldRenderWebGL({
        reducedMotion: reducedMotion.matches,
        webGLAvailable: profile.available,
        width: window.innerWidth,
      })
      setIsConstrained(profile.constrained || window.innerWidth < 768)
      if (!eligible) {
        setMounted(false)
        setCanvasReady(false)
        return
      }
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const mount = () => setMounted(true)
          if (window.requestIdleCallback) idleHandle = window.requestIdleCallback(mount, { timeout: 700 })
          else timeoutHandle = globalThis.setTimeout(mount, 0)
        })
      })
    }

    update()
    reducedMotion.addEventListener('change', update)
    window.addEventListener('resize', update, { passive: true })
    return () => {
      cancelSchedule()
      reducedMotion.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: '30% 0px' },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useGSAP(() => {
    const root = rootRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const visual = root.querySelector<HTMLElement>('[data-hero-liquid-visual]')
    const caption = root.querySelector<HTMLElement>('.art-caption')
    if (!visual || !caption) return

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: root,
        start: 'top top+=58',
        end: 'bottom top',
        scrub: 0.65,
      },
    })
    timeline.fromTo(
      visual,
      { scale: 1.05, yPercent: 0 },
      { ease: 'none', scale: 1, yPercent: 10.7 },
      0,
    )
    timeline.fromTo(caption, { y: '0vh' }, { ease: 'none', y: '-2.5vh' }, 0)
    return () => timeline.kill()
  }, { scope: rootRef })

  return (
    <div
      ref={rootRef}
      className="hero-art hero-liquid"
      data-hero-liquid-active={isActive ? '' : undefined}
      data-hero-liquid-ready={canvasReady ? '' : undefined}
    >
      <div className="hero-liquid__visual" data-hero-liquid-visual>
        <AtlasPicture
          visual={atlasVisuals.hero}
          alt="A geometric Aegean city aligned with a rising sun"
          className="atlas-picture atlas-picture--hero"
          cursor="read"
          sizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
          priority
        />
        {mounted && isActive && (
          <div className="hero-liquid__canvas" data-hero-liquid-canvas aria-hidden="true">
            <SceneBoundary>
              <HeroLiquidScene
                active={isActive}
                isConstrained={isConstrained}
                onReady={handleReady}
              />
            </SceneBoundary>
          </div>
        )}
      </div>
      <p className="art-caption art-caption--light">Plate 01 / Ambition needs systems</p>
    </div>
  )
}

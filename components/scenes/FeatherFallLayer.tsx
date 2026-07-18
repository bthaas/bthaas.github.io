'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import dynamic from 'next/dynamic'
import { Component, useEffect, useRef, useState } from 'react'

import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

gsap.registerPlugin(useGSAP)

const FeatherFallScene = dynamic(
  () => import('./FeatherFallScene').then((module) => module.FeatherFallScene),
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

export function FeatherFallLayer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [isConstrained, setIsConstrained] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showStats, setShowStats] = useState(false)

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
      setIsConstrained(profile.constrained)
      setIsMobile(window.innerWidth < 768)
      setShowStats(new URLSearchParams(window.location.search).get('stats') === '1')
      if (!eligible) {
        setMounted(false)
        return
      }
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const mount = () => setMounted(true)
          if (window.requestIdleCallback) {
            idleHandle = window.requestIdleCallback(mount, { timeout: 900 })
          } else {
            timeoutHandle = globalThis.setTimeout(mount, 0)
          }
        })
      })
    }

    update()
    window.addEventListener('resize', update, { passive: true })
    reducedMotion.addEventListener('change', update)
    return () => {
      cancelSchedule()
      window.removeEventListener('resize', update)
      reducedMotion.removeEventListener('change', update)
    }
  }, [])

  useGSAP(
    () => {
      if (!mounted || !rootRef.current) return
      gsap.fromTo(rootRef.current, { opacity: 0 }, { duration: 0.5, ease: 'power1.out', opacity: 1 })
    },
    { dependencies: [mounted], scope: rootRef },
  )

  if (!mounted) return null

  return (
    <div
      ref={rootRef}
      className="feather-fall-layer"
      data-feather-tier={isMobile ? 'mobile-40' : isConstrained ? 'desktop-software-40' : 'desktop-120'}
      data-testid="feather-fall-layer"
      data-feather-fall-layer
      aria-hidden="true"
    >
      <SceneBoundary>
        <FeatherFallScene
          isConstrained={isConstrained}
          isMobile={isMobile}
          showStats={showStats}
        />
      </SceneBoundary>
    </div>
  )
}

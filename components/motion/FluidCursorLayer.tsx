'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

import { getFluidCursorEligibility } from '@/lib/atlas-motion/entrance'
import { detectWebGLProfile } from '@/lib/client-capabilities'

gsap.registerPlugin(useGSAP)

const SplashCursor = dynamic(() => import('@/components/bits/SplashCursor'), {
  ssr: false,
})

export function FluidCursorLayer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [constrained, setConstrained] = useState(false)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)')
    const hover = window.matchMedia('(hover: hover)')
    let firstFrame = 0
    let secondFrame = 0
    let idleHandle = 0
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined

    const cancelSchedule = () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      const cancelIdle = (window as Partial<Window>).cancelIdleCallback
      if (cancelIdle) cancelIdle(idleHandle)
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle)
    }

    const updateEligibility = () => {
      cancelSchedule()
      const profile = detectWebGLProfile()
      const eligible = getFluidCursorEligibility({
        finePointer: finePointer.matches,
        hover: hover.matches,
        reducedMotion: reducedMotion.matches,
        webgl: profile.available,
      })
      setConstrained(profile.constrained)
      if (!eligible) {
        setMounted(false)
        return
      }

      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const mount = () => setMounted(true)
          const requestIdle = (window as Partial<Window>).requestIdleCallback
          if (requestIdle) {
            idleHandle = requestIdle(mount, { timeout: 800 })
          } else {
            timeoutHandle = globalThis.setTimeout(mount, 0)
          }
        })
      })
    }

    updateEligibility()
    reducedMotion.addEventListener('change', updateEligibility)
    finePointer.addEventListener('change', updateEligibility)
    hover.addEventListener('change', updateEligibility)

    return () => {
      cancelSchedule()
      reducedMotion.removeEventListener('change', updateEligibility)
      finePointer.removeEventListener('change', updateEligibility)
      hover.removeEventListener('change', updateEligibility)
    }
  }, [])

  useGSAP(() => {
    if (!mounted || !rootRef.current) return
    gsap.fromTo(
      rootRef.current,
      { opacity: 0 },
      { duration: 0.3, ease: 'power1.out', opacity: 1 },
    )
  }, { dependencies: [mounted], scope: rootRef })

  if (!mounted) return null

  return (
    <div ref={rootRef} className="fluid-cursor-layer" data-fluid-cursor-layer aria-hidden="true">
      <SplashCursor constrained={constrained} />
    </div>
  )
}

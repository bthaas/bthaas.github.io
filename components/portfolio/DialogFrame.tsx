'use client'

import { useLayoutEffect, useRef } from 'react'

export function DialogFrame() {
  const frameRef = useRef<SVGSVGElement>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    const dialog = frame?.closest<HTMLElement>('.project-dialog')
    const backdrop = frame?.closest<HTMLElement>('.dialog-backdrop')
    const path = frame?.querySelector<SVGPathElement>('path')
    if (!frame || !dialog || !backdrop || !path) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      path.style.strokeDashoffset = '0'
      return
    }

    let cancelled = false
    let cleanup: () => void = () => undefined
    void import('gsap').then(({ gsap }) => {
      if (cancelled) return
      const context = gsap.context(() => {
        gsap
          .timeline({ defaults: { ease: 'power2.out' } })
          .fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24 })
          .fromTo(dialog, { y: 34, scale: 0.975 }, { y: 0, scale: 1, duration: 0.52 }, 0)
          .fromTo(
            path,
            { strokeDasharray: 3200, strokeDashoffset: 3200 },
            { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' },
            0.08,
          )
      }, dialog)
      cleanup = () => context.revert()
    })

    return () => {
      cancelled = true
      cleanup()
    }
  }, [])

  return (
    <svg
      ref={frameRef}
      aria-hidden="true"
      className="dialog-drawn-frame"
      preserveAspectRatio="none"
      viewBox="0 0 1000 600"
    >
      <path d="M3 3H997V597H3Z" pathLength="3200" />
    </svg>
  )
}

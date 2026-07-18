'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useRef } from 'react'

import { getFlightLogTilt } from '@/lib/atlas-motion/project-flight-path'

gsap.registerPlugin(useGSAP)

interface TiltedCardProps extends React.PropsWithChildren {
  readonly className?: string
  readonly maximumDegrees?: number
}

/**
 * Source-vendored from the React Bits TiltedCard interaction pattern, reduced
 * to the Atlas's DOM-only pointer tilt and GSAP ownership contract.
 */
export function TiltedCard({
  children,
  className,
  maximumDegrees = 6,
}: TiltedCardProps) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const surface = surfaceRef.current
    if (!surface || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    surface.dataset.tiltedCardReady = ''
    const rotateX = gsap.quickTo(surface, 'rotateX', {
      duration: 0.5,
      ease: 'power3.out',
    })
    const rotateY = gsap.quickTo(surface, 'rotateY', {
      duration: 0.5,
      ease: 'power3.out',
    })
    gsap.set(surface, { transformPerspective: 900, transformOrigin: 'center center' })

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== 'mouse') return
      const bounds = surface.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      const frame = getFlightLogTilt({
        x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
        y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
      }, maximumDegrees)
      rotateX(frame.rotateX)
      rotateY(frame.rotateY)
    }
    const handlePointerLeave = () => {
      rotateX(0)
      rotateY(0)
    }

    surface.addEventListener('pointermove', handlePointerMove, { passive: true })
    surface.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      surface.removeEventListener('pointermove', handlePointerMove)
      surface.removeEventListener('pointerleave', handlePointerLeave)
      delete surface.dataset.tiltedCardReady
      gsap.killTweensOf(surface)
      gsap.set(surface, { clearProps: 'transform,transformOrigin' })
    }
  }, { dependencies: [maximumDegrees], scope: surfaceRef })

  return (
    <div ref={surfaceRef} className={className}>
      {children}
    </div>
  )
}

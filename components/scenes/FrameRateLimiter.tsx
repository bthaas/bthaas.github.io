'use client'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

import { createFramePacer } from '@/lib/frame-pacing'

interface FrameRateLimiterProps {
  readonly fps: number
  /** While true, render on every display refresh (e.g. during scroll-driven motion). */
  readonly fullRate?: () => boolean
  /** While false, skip rendering entirely because the scene has nothing to draw. */
  readonly shouldRender?: () => boolean
}

/**
 * Drives a `frameloop="demand"` canvas at a capped rate. A full-viewport canvas
 * recomposites the whole page on every draw, so idle or ambient animation should
 * not follow a 120 Hz display refresh.
 */
export function FrameRateLimiter({ fps, fullRate, shouldRender }: FrameRateLimiterProps) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    const pacer = createFramePacer(fps)
    let animationFrame = 0
    const tick = (time: number) => {
      animationFrame = requestAnimationFrame(tick)
      if (!(shouldRender?.() ?? true)) return
      if (fullRate?.() || pacer.shouldRender(time)) invalidate()
    }
    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [fps, fullRate, invalidate, shouldRender])

  return null
}

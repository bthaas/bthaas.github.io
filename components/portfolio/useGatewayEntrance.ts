'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { useState, type RefObject } from 'react'

import { GATEWAY_CYLINDER_SEGMENTS } from '@/lib/portfolio-gateway'
import {
  GATEWAY_ENTRANCE_DURATION_SECONDS,
  GATEWAY_ENTRANCE_STORAGE_KEY,
  getGatewaySliceEntrance,
  shouldRunGatewayEntrance,
  type GatewayEntranceState,
  type GatewaySliceEntrance,
} from '@/lib/portfolio-gateway-entrance'

gsap.registerPlugin(useGSAP)

const PERFORMANCE_MARK = 'atlas-gateway-entrance-start'
const PERFORMANCE_MEASURE = 'atlas-gateway-entrance-duration'

interface GatewayEntranceTargets {
  readonly controls: HTMLElement
  readonly entranceTargets: HTMLElement[]
  readonly introduction: HTMLElement
  readonly shadow: HTMLElement
  readonly slices: HTMLElement[]
  readonly wordCharacters: HTMLElement[]
}

function hasSeenGatewayEntrance(): boolean {
  try {
    return sessionStorage.getItem(GATEWAY_ENTRANCE_STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function rememberGatewayEntrance(): void {
  try {
    sessionStorage.setItem(GATEWAY_ENTRANCE_STORAGE_KEY, '1')
  } catch {
    // Unavailable storage must not leave the gateway locked.
  }
}

function recordEntranceStart(): void {
  if (typeof performance.mark !== 'function') return
  performance.clearMarks(PERFORMANCE_MARK)
  performance.clearMeasures(PERFORMANCE_MEASURE)
  performance.mark(PERFORMANCE_MARK)
}

function recordEntranceEnd(): void {
  if (typeof performance.mark !== 'function' || typeof performance.measure !== 'function') return
  performance.mark('atlas-gateway-entrance-end')
  performance.measure(
    PERFORMANCE_MEASURE,
    PERFORMANCE_MARK,
    'atlas-gateway-entrance-end',
  )
}

function getEntranceTargets(root: HTMLElement): GatewayEntranceTargets | null {
  const slices = Array.from(root.querySelectorAll<HTMLElement>(
    '[data-gateway-entrance-slice]',
  ))
  const wordCharacters = Array.from(root.querySelectorAll<HTMLElement>(
    '[data-gateway-word-character]',
  ))
  const introduction = root.querySelector<HTMLElement>('.portfolio-gateway__introduction')
  const controls = root.querySelector<HTMLElement>('.portfolio-gateway__controls')
  const shadow = root.querySelector<HTMLElement>('.portfolio-gateway__ground-shadow')

  if (
    slices.length !== GATEWAY_CYLINDER_SEGMENTS.length
    || wordCharacters.length === 0
    || !introduction
    || !controls
    || !shadow
  ) return null

  return {
    controls,
    entranceTargets: [...slices, ...wordCharacters, introduction, controls, shadow],
    introduction,
    shadow,
    slices,
    wordCharacters,
  }
}

function clearEntranceProperties(targets: readonly HTMLElement[]): void {
  gsap.set(targets, {
    clearProps: 'filter,opacity,transform,transformOrigin,willChange',
  })
}

function prepareEntrance(
  targets: GatewayEntranceTargets,
  slices: readonly GatewaySliceEntrance[],
): void {
  targets.slices.forEach((slice, index) => {
    const entrance = slices[index]
    gsap.set(slice, {
      opacity: 0,
      rotationX: entrance.rotationX,
      rotationY: entrance.rotationY,
      rotationZ: entrance.rotationZ,
      scale: entrance.scale,
      transformOrigin: '50% 50%',
      willChange: 'transform, opacity',
      x: entrance.x,
      y: -entrance.fallDistance,
    })
  })
  gsap.set(targets.wordCharacters, {
    filter: 'blur(12px)',
    opacity: 0,
    willChange: 'transform, opacity, filter',
    x: (index: number) => (index % 2 === 0 ? -1 : 1) * (10 + index * 1.5),
    y: (index: number) => -64 - index * 7,
  })
  gsap.set(targets.introduction, {
    opacity: 0,
    willChange: 'transform, opacity',
    y: -18,
  })
  gsap.set(targets.controls, {
    opacity: 0,
    willChange: 'transform, opacity',
    y: 24,
  })
  gsap.set(targets.shadow, {
    filter: 'blur(1.15rem)',
    opacity: 0.06,
    scaleX: 1.24,
    scaleY: 0.54,
    transformOrigin: '50% 50%',
    willChange: 'transform, opacity, filter',
  })
}

function addEntranceTweens(
  timeline: gsap.core.Timeline,
  targets: GatewayEntranceTargets,
  slices: readonly GatewaySliceEntrance[],
): void {
  targets.slices.forEach((slice, index) => {
    timeline.to(slice, {
      clearProps: 'opacity,transform,transformOrigin,willChange',
      duration: 1.08,
      ease: 'back.out(1.3)',
      opacity: 1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      scale: 1,
      x: 0,
      y: 0,
    }, 0.1 + slices[index].delay)
  })
  timeline.to(targets.wordCharacters, {
    clearProps: 'filter,opacity,transform,willChange',
    duration: 0.88,
    ease: 'power4.out',
    filter: 'blur(0px)',
    opacity: 1,
    stagger: 0.035,
    x: 0,
    y: 0,
  }, 0.9)
  timeline.to(targets.shadow, {
    clearProps: 'filter,opacity,transform,transformOrigin,willChange',
    duration: 0.72,
    ease: 'power3.out',
    filter: 'blur(0.45rem)',
    opacity: 0.28,
    scaleX: 1,
    scaleY: 1,
  }, 1.24)
  timeline.to(targets.introduction, {
    clearProps: 'opacity,transform,willChange',
    duration: 0.58,
    ease: 'power3.out',
    opacity: 1,
    y: 0,
  }, 1.62)
  timeline.to(targets.controls, {
    clearProps: 'opacity,transform,willChange',
    duration: 0.58,
    ease: 'power3.out',
    opacity: 1,
    y: 0,
  }, 1.88)
  timeline.call(() => undefined, [], GATEWAY_ENTRANCE_DURATION_SECONDS)
}

export function useGatewayEntrance(
  rootRef: RefObject<HTMLElement | null>,
): GatewayEntranceState {
  const [state, setState] = useState<GatewayEntranceState>('settled')

  useGSAP(() => {
    const root = rootRef.current
    if (!root) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!shouldRunGatewayEntrance({
      reducedMotion: reducedMotion.matches,
      seen: hasSeenGatewayEntrance(),
    })) {
      setState('settled')
      return
    }

    const targets = getEntranceTargets(root)
    if (!targets) {
      setState('settled')
      return
    }

    setState('pending')
    const viewportHeight = Math.max(window.innerHeight, 640)
    const slices = GATEWAY_CYLINDER_SEGMENTS.map((segment, index) => (
      getGatewaySliceEntrance(index, segment.angle, viewportHeight)
    ))
    prepareEntrance(targets, slices)

    let observer: IntersectionObserver | null = null
    let timeline: gsap.core.Timeline | null = null
    let finished = false

    const settle = (remember: boolean, measure: boolean) => {
      if (finished) return
      finished = true
      observer?.disconnect()
      timeline?.kill()
      clearEntranceProperties(targets.entranceTargets)
      if (remember) rememberGatewayEntrance()
      if (measure) recordEntranceEnd()
      setState('settled')
    }

    const start = () => {
      if (timeline || finished) return
      observer?.disconnect()
      setState('entering')
      recordEntranceStart()
      timeline = gsap.timeline({ onComplete: () => settle(true, true) })
      addEntranceTweens(timeline, targets, slices)
    }

    const handleMotionChange = () => {
      if (reducedMotion.matches) settle(false, timeline !== null)
    }
    reducedMotion.addEventListener('change', handleMotionChange)

    if (typeof IntersectionObserver === 'undefined') {
      start()
    } else {
      observer = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting) start()
      }, { threshold: 0.2 })
      observer.observe(root)
    }

    return () => {
      finished = true
      observer?.disconnect()
      timeline?.kill()
      reducedMotion.removeEventListener('change', handleMotionChange)
      clearEntranceProperties(targets.entranceTargets)
    }
  }, { scope: rootRef })

  return state
}

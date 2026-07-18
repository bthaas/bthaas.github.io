import {
  getSectionApexProgress,
  getSunArcPosition,
  type SunArcPosition,
} from '../../lib/atlas-motion/sun-arc'

import type { ScrollSnapshot } from './scroll-bus'
import { getAtlasEngine, type AtlasEngine } from './engine'

const WAYPOINT_IDS = ['experience', 'projects', 'craft', 'contact'] as const

type ObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit,
) => IntersectionObserver

export interface SunProgressDetail {
  readonly position: SunArcPosition
  readonly progress: number
}

/**
 * Step 7 finale handshake: listen for `atlas:sun-progress` on `window`.
 * The event detail contains normalized document `progress` and the current
 * `position`; the Contact finale can coordinate its horizon glow without
 * creating a second scroll listener or reading layout during a frame.
 */
export const SUN_PROGRESS_EVENT = 'atlas:sun-progress'

function measureTrajectoryApex(root: Document, runtimeWindow: Window): number {
  const trajectory = root.getElementById('experience')
  if (!trajectory) return 0.4
  const bounds = trajectory.getBoundingClientRect()
  return getSectionApexProgress({
    scrollHeight: root.documentElement.scrollHeight,
    sectionHeight: bounds.height,
    sectionTop: bounds.top + runtimeWindow.scrollY,
    viewportHeight: runtimeWindow.innerHeight,
  })
}

export function setupSunArc(
  root: Document = document,
  runtimeWindow: Window = window,
  getApexProgress: () => number = () => measureTrajectoryApex(root, runtimeWindow),
  engine: AtlasEngine | null = getAtlasEngine(),
): () => void {
  const sun = root.querySelector<SVGGElement>('[data-atlas-sun]')
  const path = root.querySelector<SVGPathElement>('[data-atlas-sun-path]')
  if (!sun || !path || !engine) return () => undefined

  let apexProgress = getApexProgress()
  let latestProgress = 0
  const render = (progress: number) => {
    latestProgress = progress
    const position = getSunArcPosition(progress, apexProgress)
    runtimeWindow.dispatchEvent(new CustomEvent<SunProgressDetail>(SUN_PROGRESS_EVENT, {
      detail: { position, progress: position.progress },
    }))
  }
  const handleScroll = (event: Event) => {
    const { detail } = event as CustomEvent<ScrollSnapshot>
    render(detail?.documentProgress ?? 0)
  }
  const handleResize = () => {
    apexProgress = getApexProgress()
    render(latestProgress)
  }

  const timeline = engine.gsap.timeline({
    scrollTrigger: {
      start: 0,
      end: 'max',
      scrub: 0.5,
    },
  })
  timeline.fromTo(
    path,
    { drawSVG: '0%' },
    { drawSVG: '100%', ease: 'none' },
    0,
  )
  timeline.to(
    sun,
    {
      ease: 'none',
      motionPath: {
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false,
        path,
      },
    },
    0,
  )

  runtimeWindow.addEventListener('atlas:scroll', handleScroll)
  runtimeWindow.addEventListener('resize', handleResize, { passive: true })
  return () => {
    timeline.kill()
    runtimeWindow.removeEventListener('atlas:scroll', handleScroll)
    runtimeWindow.removeEventListener('resize', handleResize)
  }
}

export function setupSectionWayfinding(
  root: Document = document,
  createObserver: ObserverFactory | undefined =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : (callback, options) => new IntersectionObserver(callback, options),
): () => void {
  const waypoints = WAYPOINT_IDS.flatMap((id) => {
    const section = root.getElementById(id)
    const link = root.querySelector<HTMLAnchorElement>(`.nav-links a[href="#${id}"]`)
    return section && link ? [{ id, link, section }] : []
  })
  if (!createObserver || waypoints.length === 0) return () => undefined

  const activePositions = new Map<string, number>()
  const setCurrent = (id: string) => {
    waypoints.forEach((waypoint) => {
      if (waypoint.id === id) waypoint.link.setAttribute('aria-current', 'true')
      else waypoint.link.removeAttribute('aria-current')
    })
  }
  const observer = createObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).id
        if (entry.isIntersecting) activePositions.set(id, entry.boundingClientRect.top)
        else activePositions.delete(id)
      })
      const current = [...activePositions].sort(([, firstTop], [, secondTop]) => (
        Math.abs(firstTop) - Math.abs(secondTop)
      ))[0]
      if (current) setCurrent(current[0])
    },
    { rootMargin: '-28% 0px -62% 0px', threshold: 0 },
  )

  waypoints.forEach(({ section }) => observer.observe(section))
  return () => {
    observer.disconnect()
    waypoints.forEach(({ link }) => link.removeAttribute('aria-current'))
  }
}

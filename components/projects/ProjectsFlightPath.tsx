'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

import { AtlasPicture } from '@/components/portfolio/AtlasPicture'
import { projectVisualAlts } from '@/components/portfolio/ProjectCaseStudy'
import { atlasVisuals } from '@/content/editorial-visuals'
import type { Project } from '@/content/site-content'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'
import {
  getProjectAnchorScrollY,
  getProjectFlightFrame,
  getProjectTrackTravel,
  type ProjectFlightFrame,
} from '@/lib/atlas-motion/project-flight-path'

import type {
  ProjectFlightMotionState,
  ProjectPlaneLayout,
} from './project-flight-types'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const ProjectFlightScene = dynamic(
  () => import('../scenes/AtlasWebGLScenes').then((module) => module.ProjectFlightScene),
  { ssr: false },
)

interface SceneBoundaryProps extends React.PropsWithChildren {
  readonly onError: () => void
}

interface SceneBoundaryState {
  readonly failed: boolean
}

class SceneBoundary extends Component<SceneBoundaryProps, SceneBoundaryState> {
  state: SceneBoundaryState = { failed: false }

  static getDerivedStateFromError(): SceneBoundaryState {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface ProjectsFlightPathProps {
  readonly projects: readonly Project[]
}

interface PinMetrics {
  pinDistance: number
  pinStart: number
}

export function ProjectsFlightPath({ projects }: ProjectsFlightPathProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLElement>(null)
  const layoutRef = useRef<ProjectPlaneLayout[]>([])
  const motionRef = useRef<ProjectFlightMotionState>({ velocity: 0 })
  const velocityFrameRef = useRef<ProjectFlightFrame>({ bend: 0, skewDegrees: 0, uvShift: 0 })
  const pinMetricsRef = useRef<PinMetrics>({ pinDistance: 0, pinStart: 0 })
  const [canvasReady, setCanvasReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(true)
  const handleReady = useCallback(() => setCanvasReady(true), [])
  const handleSceneError = useCallback(() => {
    setCanvasReady(false)
    setMounted(false)
  }, [])

  const scrollToPanel = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (
      window.innerWidth < 768
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return
    const metrics = pinMetricsRef.current
    if (metrics.pinDistance <= 0) return
    window.scrollTo({
      behavior,
      top: getProjectAnchorScrollY({
        count: projects.length,
        headerOffset: 58,
        index,
        pinDistance: metrics.pinDistance,
        pinStart: metrics.pinStart,
      }),
    })
  }, [projects.length])

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
      const webGLEligible = shouldRenderWebGL({
        reducedMotion: reducedMotion.matches,
        webGLAvailable: profile.available,
        width: window.innerWidth,
      })
      const eligible = webGLEligible && window.innerWidth >= 768
      if (!eligible) {
        setMounted(false)
        setCanvasReady(false)
        return
      }
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          const mount = () => setMounted(true)
          if (window.requestIdleCallback) {
            idleHandle = window.requestIdleCallback(mount, { timeout: 800 })
          } else {
            timeoutHandle = globalThis.setTimeout(mount, 0)
          }
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
    const stage = stageRef.current
    if (!stage || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: '80% 0px' },
    )
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!active) setCanvasReady(false)
  }, [active])

  useEffect(() => {
    const handleHash = () => {
      const index = projects.findIndex(({ id }) => window.location.hash === `#project-${id}`)
      if (index < 0) return
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToPanel(index, 'auto')))
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [projects, scrollToPanel])

  useGSAP(() => {
    const stage = stageRef.current
    const track = trackRef.current
    if (!stage || !track) return
    const surfaces = Array.from(track.querySelectorAll<HTMLElement>('[data-project-plane]'))
    const media = gsap.matchMedia()

    const measureLayouts = () => {
      layoutRef.current = surfaces.map((surface) => {
        let left = 0
        let top = 0
        let current: HTMLElement | null = surface
        while (current && current !== track) {
          left += current.offsetLeft
          top += current.offsetTop
          current = current.offsetParent as HTMLElement | null
        }
        return {
          aspect: Number(surface.dataset.projectPlaneAspect ?? 1),
          height: surface.offsetHeight,
          left,
          top,
          width: surface.offsetWidth,
        }
      })
      window.dispatchEvent(new CustomEvent('atlas:project-flight-layout'))
    }

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const skewSetters = surfaces.map((surface) => gsap.quickTo(surface, 'skewX', {
        duration: 0.42,
        ease: 'power3.out',
      }))
      const handleVelocity = (event: Event) => {
        const velocity = (event as CustomEvent<{ velocity?: number }>).detail?.velocity
        if (typeof velocity !== 'number') return
        motionRef.current.velocity = velocity
        const frame = getProjectFlightFrame(velocity, velocityFrameRef.current)
        skewSetters.forEach((setSkew) => setSkew(frame.skewDegrees))
      }
      window.addEventListener('atlas:scroll', handleVelocity)
      return () => {
        window.removeEventListener('atlas:scroll', handleVelocity)
        gsap.killTweensOf(surfaces)
        gsap.set(surfaces, { clearProps: 'skewX' })
      }
    })

    media.add(
      '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
      () => {
        stage.dataset.projectFlightEnhanced = ''
        measureLayouts()
        const getTravel = () => getProjectTrackTravel(track.scrollWidth, stage.clientWidth)
        const tween = gsap.to(track, {
          ease: 'none',
          x: () => -getTravel(),
          scrollTrigger: {
            anticipatePin: 1,
            end: () => `+=${getTravel()}`,
            invalidateOnRefresh: true,
            pin: stage,
            scrub: 0.65,
            start: 'top top+=58',
            onRefresh: () => {
              pinMetricsRef.current = {
                pinDistance: getTravel(),
                pinStart: stage.getBoundingClientRect().top + window.scrollY,
              }
              measureLayouts()
            },
          },
        })
        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
          gsap.set(track, { clearProps: 'transform' })
          delete stage.dataset.projectFlightEnhanced
          pinMetricsRef.current = { pinDistance: 0, pinStart: 0 }
        }
      },
    )

    return () => media.revert()
  }, { scope: stageRef })

  return (
    <div
      ref={stageRef}
      className="project-flight"
      data-project-flight-ready={canvasReady ? '' : undefined}
      data-project-flight-stage
    >
      <nav
        ref={trackRef}
        className="project-panel-list project-flight__track"
        aria-label="Select a project"
        data-project-flight-track
      >
        {projects.map((project, index) => {
          const visual = atlasVisuals.projects[project.visualKey]
          return (
            <div className="project-flight__item" key={project.id}>
              <span className="project-flight__ghost" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <a
                className={`project-panel project-panel--${index + 1}`}
                href={`/projects/${project.id}`}
                id={`project-${project.id}`}
                aria-label={`Open ${project.name} case study`}
                data-testid="project-panel-trigger"
                data-cursor="read"
                onFocus={() => scrollToPanel(index)}
              >
                <span
                  className="project-panel__visual"
                  data-project-plane
                  data-project-plane-aspect={visual.width / visual.height}
                >
                  <AtlasPicture
                    visual={visual}
                    alt={projectVisualAlts[project.visualKey]}
                    className="atlas-picture project-panel__art"
                    cursor="read"
                    sizes="(max-width: 720px) calc(100vw - 32px), 72vw"
                  />
                </span>
                <span className="project-panel__shade" aria-hidden="true" />
                <span className="project-panel__copy">
                  <span className="project-panel__name">{project.name}</span>
                  <span className="project-panel__description">{project.description}</span>
                </span>
                <span className="project-panel__action" aria-hidden="true">
                  <span>↗</span>
                </span>
              </a>
            </div>
          )
        })}
        {mounted && active && (
          <div className="project-flight__webgl" aria-hidden="true">
            <SceneBoundary onError={handleSceneError}>
              <ProjectFlightScene
                active={active}
                layoutRef={layoutRef}
                motionRef={motionRef}
                onReady={handleReady}
              />
            </SceneBoundary>
          </div>
        )}
      </nav>
    </div>
  )
}

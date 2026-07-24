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
import { getFrontProjectIndex, getProjectSpiralPhase } from '@/lib/project-spiral'

import type { ProjectSpiralMotionState } from './project-spiral-types'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const CARD_COUNT = 9
const ProjectSpiralScene = dynamic(
  () => import('../scenes/ProjectSpiralScene').then((module) => module.ProjectSpiralScene),
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

interface ProjectsSpiralProps {
  readonly projects: readonly Project[]
}

export function ProjectsSpiral({ projects }: ProjectsSpiralProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const activeIndexRef = useRef(0)
  const motionRef = useRef<ProjectSpiralMotionState>({
    phase: 0,
    pointerX: 0,
    pointerY: 0,
    velocity: 0,
  })
  const [activeProjectIndex, setActiveProjectIndex] = useState(0)
  const [active, setActive] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)
  const [enhanced, setEnhanced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const handleReady = useCallback(() => setCanvasReady(true), [])
  const handleActiveProjectChange = useCallback((nextIndex: number) => {
    if (nextIndex === activeIndexRef.current) return
    activeIndexRef.current = nextIndex
    setActiveProjectIndex(nextIndex)
  }, [])
  const handleSceneError = useCallback(() => {
    setCanvasReady(false)
    setEnhanced(false)
    setMounted(false)
  }, [])

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
      setShowStats(new URLSearchParams(window.location.search).get('stats') === '1')
      setIsMobile(window.innerWidth < 768)
      const profile = detectWebGLProfile()
      const eligible = shouldRenderWebGL({
        reducedMotion: reducedMotion.matches,
        webGLAvailable: profile.available,
        width: window.innerWidth,
      })
      setEnhanced(eligible)
      if (!eligible) {
        setCanvasReady(false)
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
      ([entry]) => {
        setActive(entry.isIntersecting)
        if (!entry.isIntersecting) setCanvasReady(false)
      },
      { rootMargin: '100% 0px' },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!enhanced) return
    let frame = 0
    const updateActiveProject = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const root = rootRef.current
        if (!root) return
        const bounds = root.getBoundingClientRect()
        const travel = Math.max(1, bounds.height - window.innerHeight)
        const progress = Math.max(0, Math.min(1, -bounds.top / travel))
        const phase = getProjectSpiralPhase(progress, CARD_COUNT)
        handleActiveProjectChange(
          getFrontProjectIndex(phase, CARD_COUNT, projects.length),
        )
      })
    }

    updateActiveProject()
    window.addEventListener('scroll', updateActiveProject, { passive: true })
    window.addEventListener('resize', updateActiveProject, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateActiveProject)
      window.removeEventListener('resize', updateActiveProject)
    }
  }, [enhanced, handleActiveProjectChange, projects.length])

  useGSAP(() => {
    const stage = stageRef.current
    if (!stage || !enhanced) return
    const trigger = ScrollTrigger.create({
      anticipatePin: 1,
      end: () => `+=${window.innerHeight * 2.6}`,
      invalidateOnRefresh: true,
      pin: stage,
      scrub: 0.55,
      start: 'top top',
      onUpdate: (self) => {
        const phase = getProjectSpiralPhase(self.progress, CARD_COUNT)
        motionRef.current.phase = phase
        motionRef.current.velocity = self.getVelocity()
      },
    })
    return () => trigger.kill()
  }, {
    dependencies: [enhanced, projects.length],
    revertOnUpdate: true,
    scope: rootRef,
  })

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    motionRef.current.pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1
    motionRef.current.pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1
  }, [])
  const resetPointer = useCallback(() => {
    motionRef.current.pointerX = 0
    motionRef.current.pointerY = 0
  }, [])

  const activeProject = projects[activeProjectIndex] ?? projects[0]

  return (
    <div
      ref={rootRef}
      className="project-spiral"
      data-project-spiral-enhanced={enhanced ? '' : undefined}
    >
      <div
        ref={stageRef}
        className="project-spiral__stage"
        data-project-spiral-ready={canvasReady ? '' : undefined}
        data-project-spiral-stage
        onPointerLeave={resetPointer}
        onPointerMove={handlePointerMove}
      >
        <p className="project-spiral__mode" aria-hidden="true">
          <span>spiral</span><span>•</span><span>projects</span>
        </p>
        <nav className="project-spiral__index" aria-label="Project spiral index">
          {projects.map((project, index) => (
            <a
              aria-current={index === activeProjectIndex ? 'true' : undefined}
              href={`/projects/${project.id}`}
              key={project.id}
            >
              {String(index + 1).padStart(2, '0')}
              <span>{project.name}</span>
            </a>
          ))}
        </nav>
        {mounted && active && (
          <div className="project-spiral__webgl" aria-hidden="true">
            <SceneBoundary onError={handleSceneError}>
              <ProjectSpiralScene
                active={active}
                isMobile={isMobile}
                motionRef={motionRef}
                onReady={handleReady}
                showStats={showStats}
              />
            </SceneBoundary>
          </div>
        )}
        {activeProject && (
          <a
            className="project-spiral__active-link"
            data-cursor="read"
            href={`/projects/${activeProject.id}`}
            aria-label={`Open ${activeProject.name} case study`}
          >
            <span className="project-spiral__active-label">
              <span>{String(activeProjectIndex + 1).padStart(2, '0')}</span>
              <strong>{activeProject.name}</strong>
              <span aria-hidden="true">↗</span>
            </span>
          </a>
        )}
        <p className="project-spiral__hint">Scroll to spin · Move to look</p>
      </div>

      <nav
        className="atlas-shell project-spiral__fallback"
        aria-label="Select a project"
        data-project-spiral-fallback
      >
        {projects.map((project, index) => (
          <a
            className={`project-panel project-panel--${index + 1}`}
            href={`/projects/${project.id}`}
            id={`project-${project.id}`}
            aria-label={`Open ${project.name} case study`}
            data-atlas-plate-sheen
            data-cursor="read"
            data-testid="project-spiral-fallback-link"
            key={project.id}
          >
            <AtlasPicture
              visual={atlasVisuals.projects[project.visualKey]}
              alt={projectVisualAlts[project.visualKey]}
              className="atlas-picture project-panel__art"
              cursor="read"
              sizes="(max-width: 767px) calc(100vw - 32px), 32vw"
            />
            <span className="project-panel__shade" aria-hidden="true" />
            <span className="project-panel__copy">
              <span className="project-panel__name">{project.name}</span>
              <span className="project-panel__description">{project.description}</span>
            </span>
            <span className="project-panel__action" aria-hidden="true"><span>↗</span></span>
          </a>
        ))}
      </nav>
    </div>
  )
}

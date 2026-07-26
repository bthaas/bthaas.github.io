'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import { AtlasPicture } from '@/components/portfolio/AtlasPicture'
import { projectVisualAlts } from '@/components/portfolio/ProjectCaseStudy'
import { atlasVisuals } from '@/content/editorial-visuals'
import type { Project } from '@/content/site-content'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'
import {
  getDefaultProjectView,
  getFrontProjectIndex,
  getProjectSpiralPhase,
  type ProjectView,
} from '@/lib/project-spiral'
import { shouldAnimateProjectViewTransition } from '@/lib/project-spiral-rendering'

import type { ProjectSpiralMotionState } from './project-spiral-types'

gsap.registerPlugin(useGSAP, Flip, ScrollTrigger)

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
  const projectsRef = useRef<HTMLUListElement>(null)
  const activeIndexRef = useRef(0)
  const reducedMotionRef = useRef(false)
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
  const [view, setView] = useState<ProjectView>('spiral')
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
    setView('index')
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
      reducedMotionRef.current = reducedMotion.matches
      if (reducedMotion.matches) {
        setView(getDefaultProjectView(true))
      }
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
        if (!reducedMotion.matches) setView('index')
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
    if (!enhanced || view !== 'spiral') return
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
  }, [enhanced, handleActiveProjectChange, projects.length, view])

  useGSAP(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage || !enhanced || view !== 'spiral') return
    const trigger = ScrollTrigger.create({
      end: 'bottom bottom',
      invalidateOnRefresh: true,
      scrub: 0.55,
      start: 'top top',
      trigger: root,
      onUpdate: (self) => {
        const phase = getProjectSpiralPhase(self.progress, CARD_COUNT)
        motionRef.current.phase = phase
        motionRef.current.velocity = self.getVelocity()
      },
    })
    return () => trigger.kill()
  }, {
    dependencies: [enhanced, projects.length, view],
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

  const handleViewChange = useCallback((nextView: ProjectView) => {
    if (nextView === view) return

    const root = rootRef.current
    if (nextView === 'index' && root) {
      const rootTop = root.getBoundingClientRect().top
      if (rootTop < 0) window.scrollTo(0, window.scrollY + rootTop)
    }

    const cards = projectsRef.current
      ? Array.from(projectsRef.current.querySelectorAll('[data-project-spiral-card]'))
      : []
    const shouldAnimate = cards.length > 0 && shouldAnimateProjectViewTransition(
      reducedMotionRef.current,
      view,
      nextView,
    )

    if (shouldAnimate) Flip.killFlipsOf(cards)
    const flipState = shouldAnimate ? Flip.getState(cards) : null

    flushSync(() => {
      setView(nextView)
      if (nextView === 'index') setCanvasReady(false)
    })

    if (flipState) {
      Flip.from(flipState, {
        absolute: true,
        duration: 0.78,
        ease: 'power3.inOut',
        nested: true,
        prune: true,
        scale: true,
        stagger: 0.045,
        onComplete: () => ScrollTrigger.refresh(),
      })
      return
    }

    ScrollTrigger.refresh()
  }, [view])

  const activeProject = projects[activeProjectIndex] ?? projects[0]

  return (
    <div
      ref={rootRef}
      className="project-spiral"
      data-project-view={view}
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
        {mounted && active && view === 'spiral' && (
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

      <div className="project-spiral__overlay">
        <div className="atlas-shell project-spiral__overlay-inner">
          <div
            className="project-spiral__view-toggle"
            role="group"
            aria-label="Project view"
          >
            <span aria-hidden="true">View</span>
            <button
              aria-pressed={view === 'spiral'}
              aria-label="Spiral view"
              onClick={() => handleViewChange('spiral')}
              type="button"
            >
              Spiral
            </button>
            <button
              aria-pressed={view === 'index'}
              aria-label="Index view"
              onClick={() => handleViewChange('index')}
              type="button"
            >
              Index
            </button>
          </div>

          <ul
            ref={projectsRef}
            className="project-spiral__projects"
            aria-label="Projects"
            data-project-spiral-fallback
          >
            {projects.map((project, index) => (
              <li
                aria-label={`${project.name} project`}
                data-project-spiral-card
                data-flip-id={`project-${project.id}`}
                key={project.id}
              >
                <article>
                  <span className="project-spiral__number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <AtlasPicture
                    visual={atlasVisuals.projects[project.visualKey]}
                    alt={projectVisualAlts[project.visualKey]}
                    className="atlas-picture project-spiral__thumbnail"
                    cursor="read"
                    sizes="(max-width: 767px) 1px, 9rem"
                  />
                  <div className="project-spiral__copy">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                    <ul
                      className="project-spiral__technologies"
                      aria-label={`${project.name} technologies`}
                    >
                      {project.technologies.map((technology) => (
                        <li key={technology}>{technology}</li>
                      ))}
                    </ul>
                  </div>
                  <a
                    aria-current={
                      view === 'spiral' && index === activeProjectIndex ? 'true' : undefined
                    }
                    aria-label={`Open ${project.name} case study`}
                    className="project-spiral__case-study-link"
                    data-cursor="read"
                    data-testid="project-spiral-fallback-link"
                    href={`/projects/${project.id}`}
                    id={`project-${project.id}`}
                  >
                    <span>Case study</span>
                    <span aria-hidden="true">↗</span>
                  </a>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

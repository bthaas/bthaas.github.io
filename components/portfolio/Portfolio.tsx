'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  Mail,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { HeroExperience } from '@/components/scenes/HeroExperience'
import { SectionSceneExperience } from '@/components/scenes/SectionSceneExperience'
import { siteContent, type AboutItem, type Project } from '@/content/site-content'

const ProjectDialog = dynamic(() => import('./ProjectDialog'), { ssr: false })

const fragmentClasses = [
  'fragment-one',
  'fragment-two',
  'fragment-three',
  'fragment-four',
  'fragment-five',
] as const

const constellationNodes = [
  { label: 'Python', x: 14, y: 28 },
  { label: 'TypeScript', x: 38, y: 14 },
  { label: 'React', x: 66, y: 24 },
  { label: 'AWS', x: 84, y: 45 },
  { label: 'Java', x: 66, y: 72 },
  { label: 'gRPC', x: 39, y: 82 },
  { label: 'Three.js', x: 15, y: 65 },
  { label: 'PyTorch', x: 44, y: 49 },
]

const constellationEdges = [
  [0, 1],
  [0, 7],
  [1, 2],
  [1, 7],
  [2, 3],
  [2, 7],
  [3, 4],
  [4, 5],
  [4, 7],
  [5, 6],
  [5, 7],
  [6, 0],
  [6, 7],
] as const

interface ExperienceProgressRefs {
  readonly fracture: React.MutableRefObject<number>
  readonly about: React.MutableRefObject<number>
  readonly experience: React.MutableRefObject<number>
  readonly projects: React.MutableRefObject<number>
  readonly ending: React.MutableRefObject<number>
}

function useScrollExperience(progressRefs: ExperienceProgressRefs) {
  useEffect(() => {
    const root = document.documentElement
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).get('motion') === 'reduce'
    if (reducedMotion) {
      root.dataset.motion = 'reduce'
      Object.values(progressRefs).forEach((progressRef) => {
        progressRef.current = 0
      })
      return () => {
        delete root.dataset.motion
      }
    }
    delete root.dataset.motion

    let disposed = false
    let cleanupExperience = () => undefined

    const initialize = async () => {
      removeStartListeners()
      const [gsapModule, scrollTriggerModule, lenisModule] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
        import('lenis'),
      ])
      if (disposed) return

      const { gsap } = gsapModule
      const { ScrollTrigger } = scrollTriggerModule
      const Lenis = lenisModule.default
      gsap.registerPlugin(ScrollTrigger)
      const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.88 })
      let frame = 0
      const raf = (time: number) => {
        lenis.raf(time)
        frame = requestAnimationFrame(raf)
      }
      frame = requestAnimationFrame(raf)
      lenis.on('scroll', ScrollTrigger.update)

      const context = gsap.context(() => {
        const heroShell = document.querySelector<HTMLElement>('#hero')
        const heroStage = heroShell?.querySelector<HTMLElement>('.hero-stage')

        if (heroShell && heroStage) {
          const descentTimeline = gsap.timeline({
            defaults: { ease: 'power2.inOut' },
            scrollTrigger: {
              trigger: heroShell,
              start: 'top top',
              end: () => `+=${heroShell.offsetHeight}`,
              pin: heroStage,
              pinSpacing: false,
              scrub: 0.75,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: ({ progress }) => {
                progressRefs.fracture.current = progress
                root.style.setProperty('--hero-progress', progress.toFixed(3))
              },
            },
          })

          descentTimeline
            .to(
              '.scroll-cue',
              { autoAlpha: 0, duration: 0.12 },
              0,
            )
            .to(
              '.hero-copy',
              { autoAlpha: 0, yPercent: -12, duration: 0.46 },
              0.18,
            )
            .fromTo(
              '.cloud-reference-a',
              { autoAlpha: 0, yPercent: 18, scale: 1.08 },
              { autoAlpha: 1, yPercent: -5, scale: 1.02, duration: 0.32 },
              0.08,
            )
            .fromTo(
              '.cloud-reference-b',
              { autoAlpha: 0, yPercent: 12, scale: 1.1 },
              { autoAlpha: 1, yPercent: -3, scale: 1.03, duration: 0.3 },
              0.28,
            )
            .to('.cloud-reference-a', { autoAlpha: 0, duration: 0.2 }, 0.38)
            .fromTo(
              '.cloud-whiteout',
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.22 },
              0.39,
            )
            .to('.cloud-whiteout', { autoAlpha: 0, duration: 0.22 }, 0.61)
            .fromTo(
              '.cloud-reference-c',
              { autoAlpha: 0, yPercent: 8, scale: 1.08 },
              { autoAlpha: 1, yPercent: -6, scale: 1.02, duration: 0.32 },
              0.58,
            )
            .to('.cloud-reference-b', { autoAlpha: 0, duration: 0.2 }, 0.68)
            .to('.cloud-reference-c', { autoAlpha: 0, duration: 0.18 }, 0.88)
            .to(
              '.hero-content',
              { autoAlpha: 0, scale: 1.025, duration: 0.12 },
              0.88,
            )
            .fromTo(
              '[data-about-arrival]',
              { autoAlpha: 0, y: 64 },
              { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' },
              0.78,
            )
        }

        const sectionTimelines = [
          { selector: '#about', progressRef: progressRefs.about, cssName: '--about-progress' },
          {
            selector: '#experience',
            progressRef: progressRefs.experience,
            cssName: '--experience-progress',
          },
          {
            selector: '#projects',
            progressRef: progressRefs.projects,
            cssName: '--projects-progress',
          },
          {
            selector: '.ending-section',
            progressRef: progressRefs.ending,
            cssName: '--ending-progress',
          },
        ]

        sectionTimelines.forEach(({ selector, progressRef, cssName }) => {
          const section = document.querySelector<HTMLElement>(selector)
          if (!section) return
          gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.65,
              onUpdate: ({ progress }) => {
                progressRef.current = progress
                root.style.setProperty(cssName, progress.toFixed(3))
              },
            },
          }).fromTo(
            section.querySelectorAll('[data-scene-overlay]'),
            { autoAlpha: 0.28, yPercent: 5 },
            { autoAlpha: 1, yPercent: -3, duration: 1 },
          )
        })

        gsap.utils.toArray<HTMLElement>('[data-cloud-transition]').forEach((transition) => {
          gsap.timeline({
            scrollTrigger: {
              trigger: transition,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.55,
              onUpdate: ({ progress }) => {
                transition.style.setProperty('--transition-progress', progress.toFixed(3))
              },
            },
          })
            .fromTo(
              transition.querySelector('.cloud-transition-veil'),
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.5 },
            )
            .to(transition.querySelector('.cloud-transition-veil'), { autoAlpha: 0, duration: 0.5 })
        })

        gsap.utils
          .toArray<HTMLElement>('[data-reveal]:not([data-about-arrival])')
          .forEach((element) => {
            gsap.fromTo(
              element,
              { autoAlpha: 0, y: 40 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 1.1,
                ease: 'back.out(1.25)',
                scrollTrigger: { trigger: element, start: 'top 86%', once: true },
              },
            )
          })
      })
      ScrollTrigger.refresh()
      cleanupExperience = () => {
        cancelAnimationFrame(frame)
        context.revert()
        lenis.destroy()
        root.style.removeProperty('--hero-progress')
        root.style.removeProperty('--about-progress')
        root.style.removeProperty('--experience-progress')
        root.style.removeProperty('--projects-progress')
        root.style.removeProperty('--ending-progress')
      }
    }

    const start = () => void initialize()
    const handleKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', 'End', ' '].includes(event.key)) start()
    }
    const removeStartListeners = () => {
      window.removeEventListener('wheel', start)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('keydown', handleKey)
    }
    window.addEventListener('wheel', start, { once: true, passive: true })
    window.addEventListener('touchstart', start, { once: true, passive: true })
    window.addEventListener('keydown', handleKey)

    return () => {
      disposed = true
      removeStartListeners()
      cleanupExperience()
    }
  }, [progressRefs])
}

function SiteNav() {
  return (
    <nav
      aria-label="Primary navigation"
      className="site-nav"
    >
      <a className="nav-mark" href="#hero" aria-label="Back to top">
        <Image
          aria-hidden="true"
          className="nav-mark-image"
          src="/assets/wing-mark.png"
          alt=""
          width={32}
          height={32}
          priority
        />
      </a>
      <div className="nav-links">
        <a href="#projects">Projects</a>
        <a href="#experience">Experience</a>
        <a href="#contact">Contact</a>
      </div>
    </nav>
  )
}

function CloudDescent() {
  return (
    <div className="cloud-descent" data-cloud-descent aria-hidden="true">
      <div className="cloud-reference-frame cloud-reference-a" />
      <div className="cloud-reference-frame cloud-reference-b" />
      <div className="cloud-whiteout" />
      <div className="cloud-reference-frame cloud-reference-c" />
    </div>
  )
}

function Hero({ fractureProgressRef }: { fractureProgressRef: React.MutableRefObject<number> }) {
  const letters = useMemo(() => siteContent.identity.name.split(''), [])

  return (
    <section id="hero" className="hero-shell" aria-label="Introduction">
      <div className="hero-stage">
        <div className="hero-content">
          <HeroExperience fractureProgressRef={fractureProgressRef} />
          <div className="hero-wash" />
          <div className="hero-copy">
            <h1 aria-label="Brett Haas">
              {letters.map((letter, index) => (
                <span
                  key={`${letter}-${index}`}
                  aria-hidden="true"
                  style={{ '--letter-delay': `${index * 55}ms` } as React.CSSProperties}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </span>
              ))}
            </h1>
            <p>{siteContent.identity.title}</p>
          </div>
          <a className="scroll-cue" href="#about">
            <span>Descend</span>
            <ChevronDown size={14} />
          </a>
        </div>
        <CloudDescent />
      </div>
    </section>
  )
}

function SkillsSection() {
  const [activeNode, setActiveNode] = useState<number | null>(null)

  return (
    <div id="skills" className="section skills-section">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">01B · Connected systems</p>
        <h2>Constellation</h2>
        <p className="section-intro">Tools are most useful in relation to one another.</p>
      </div>
      <div className="constellation" data-reveal>
        <svg viewBox="0 0 100 100" role="img" aria-label="Connected technology constellation">
          {constellationEdges.map(([from, to]) => {
            const start = constellationNodes[from]
            const end = constellationNodes[to]
            const lit = activeNode === from || activeNode === to
            return (
              <line
                className={lit ? 'lit' : ''}
                key={`${from}-${to}`}
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
            )
          })}
        </svg>
        {constellationNodes.map((node, index) => (
          <button
            className={activeNode === index ? 'skill-node active' : 'skill-node'}
            key={node.label}
            onBlur={() => setActiveNode(null)}
            onFocus={() => setActiveNode(index)}
            onMouseEnter={() => setActiveNode(index)}
            onMouseLeave={() => setActiveNode(null)}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <span className="node-orbit" />
            <span className="node-dot" />
            <span className="node-label">{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function AboutSection({
  progressRef,
  onSelect,
}: {
  progressRef: React.MutableRefObject<number>
  onSelect: (item: AboutItem) => void
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section id="about" className="section about-section immersive-section" data-scene-section>
      <div className="immersive-scene-stage">
        <SectionSceneExperience
          activeIndex={activeIndex}
          progressRef={progressRef}
          variant="ruins"
        />
      </div>
      <div className="section-heading immersive-heading" data-reveal data-about-arrival data-scene-overlay>
        <p className="eyebrow">01 · In pursuit</p>
        <h2>Ambition, with<br />an engineering plan.</h2>
        <p className="section-intro">{siteContent.identity.descriptor}</p>
      </div>
      <div className="ruins ruins-controls" data-reveal data-scene-overlay>
        {siteContent.about.map((item, index) => (
          <button
            aria-label={`Explore ${item.label}`}
            className={`ruin-fragment ${fragmentClasses[index]}`}
            key={item.id}
            onBlur={() => setActiveIndex(null)}
            onClick={() => onSelect(item)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <span>{item.label}</span>
            <p>{item.caption}</p>
          </button>
        ))}
      </div>
      <SkillsSection />
    </section>
  )
}

function CloudTransition({ label }: { label: string }) {
  return (
    <div className="cloud-transition" data-cloud-transition data-testid="cloud-transition" aria-hidden="true">
      <div className="cloud-transition-outgoing" />
      <div className="cloud-transition-veil" />
      <div className="cloud-transition-incoming" />
      <span>{label}</span>
    </div>
  )
}

function ProjectsSection({
  onSelect,
  progressRef,
}: {
  onSelect: (project: Project) => void
  progressRef: React.MutableRefObject<number>
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section id="projects" className="section projects-section immersive-section" data-scene-section>
      <div className="immersive-scene-stage">
        <SectionSceneExperience
          activeIndex={activeIndex}
          progressRef={progressRef}
          variant="monolith"
        />
      </div>
      <div className="section-heading split-heading immersive-heading" data-reveal data-scene-overlay>
        <div>
          <p className="eyebrow">03 · Made tangible</p>
          <h2>Selected Work</h2>
        </div>
        <p className="section-intro">
          Systems shaped around real-time collaboration, computer vision, and model behavior.
        </p>
      </div>
      <div className="monolith-grid monolith-controls" data-scene-overlay>
        {siteContent.projects.map((project, index) => (
          <button
            aria-label={`Explore ${project.name}`}
            className="project-monolith physical-button"
            data-reveal
            key={project.id}
            onBlur={() => setActiveIndex(null)}
            onClick={() => onSelect(project)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{ '--monolith-index': index } as React.CSSProperties}
          >
            <span className="monolith-number">0{index + 1}</span>
            <span className="monolith-name">{project.name}</span>
            <span className="gold-vein" />
            <span className="monolith-stack">{project.technologies.slice(0, 3).join(' · ')}</span>
            <ArrowUpRight className="monolith-arrow" size={18} />
          </button>
        ))}
      </div>
    </section>
  )
}

function ExperienceSection({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  return (
    <section id="experience" className="section experience-section immersive-section" data-scene-section>
      <div className="immersive-scene-stage">
        <SectionSceneExperience progressRef={progressRef} variant="stairs" />
      </div>
      <div className="section-heading immersive-heading" data-reveal data-scene-overlay>
        <p className="eyebrow">02 · The descent</p>
        <h2>Experience</h2>
      </div>
      <div className="timeline stair-timeline" data-scene-overlay>
        {siteContent.experience.map((entry, index) => (
          <article className="timeline-entry" data-landing={index + 1} data-reveal key={entry.id}>
            <div className="timeline-date">{entry.period}</div>
            <div className="timeline-inscription">
              <div className="timeline-meta">
                <p>{entry.organization}</p>
                <span>{entry.location}</span>
              </div>
              <h3>{entry.role}</h3>
              {entry.team && <p className="timeline-team">{entry.team}</p>}
              <ul>
                {entry.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <div className="tag-row">
                {entry.technologies.map((technology) => (
                  <span key={technology}>{technology}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
        {siteContent.education.map((entry) => (
          <article className="timeline-entry education-entry" data-landing="4" data-reveal key={entry.degree}>
            <div className="timeline-date">{entry.graduation}</div>
            <div className="timeline-inscription">
              <div className="timeline-meta">
                <p>{entry.institution}</p>
                <span>{entry.location}</span>
              </div>
              <h3>{entry.degree}</h3>
              <p className="timeline-team">GPA {entry.gpa} · {entry.focusAreas.join(' · ')}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function EndingSection() {
  return (
    <section className="ending-section" aria-label="Closing thought" data-scene-section>
      <div className="ending-ascent ending-ascent-distant" />
      <div className="ending-ascent ending-ascent-whiteout" />
      <div className="ending-copy" data-reveal data-scene-overlay>
        <span>{siteContent.editorial.closingLine}</span>
      </div>
    </section>
  )
}

function AboutDialog({ item, onClose }: { item: AboutItem; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="project-dialog about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-dialog-title">
        <button className="dialog-close" onClick={onClose} aria-label="Close details">Close</button>
        <p className="eyebrow">Ruins inscription</p>
        <h2 id="about-dialog-title">{item.label}</h2>
        <p>{item.detail}</p>
        {item.targetId && <a href={`#${item.kind === 'projects' ? 'projects' : 'experience'}`} onClick={onClose}>Continue to the full entry</a>}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer id="contact" className="site-footer">
      <div>
        <p className="eyebrow">Let’s make the next impossible thing.</p>
        <h2>Keep building.</h2>
      </div>
      <div className="footer-links">
        <a href={`mailto:${siteContent.contact.email}`}><Mail size={16} /> Email</a>
        <a href={siteContent.contact.github} rel="noreferrer" target="_blank"><Code2 size={16} /> GitHub</a>
        <a href={siteContent.contact.linkedin} rel="noreferrer" target="_blank"><BriefcaseBusiness size={16} /> LinkedIn</a>
      </div>
      <p className="footer-note">Designed and engineered in Charlottesville · 2026</p>
    </footer>
  )
}

export function Portfolio() {
  const fractureProgressRef = useRef(0)
  const aboutProgressRef = useRef(0)
  const experienceProgressRef = useRef(0)
  const projectsProgressRef = useRef(0)
  const endingProgressRef = useRef(0)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedAbout, setSelectedAbout] = useState<AboutItem | null>(null)
  const progressRefs = useMemo(
    () => ({
      fracture: fractureProgressRef,
      about: aboutProgressRef,
      experience: experienceProgressRef,
      projects: projectsProgressRef,
      ending: endingProgressRef,
    }),
    [],
  )
  useScrollExperience(progressRefs)

  return (
    <main>
      <SiteNav />
      <Hero fractureProgressRef={fractureProgressRef} />
      <AboutSection progressRef={aboutProgressRef} onSelect={setSelectedAbout} />
      <CloudTransition label="Through the cloud deck" />
      <ExperienceSection progressRef={experienceProgressRef} />
      <CloudTransition label="Below the stair" />
      <ProjectsSection onSelect={setSelectedProject} progressRef={projectsProgressRef} />
      <CloudTransition label="Return to the light" />
      <EndingSection />
      <Footer />
      {selectedAbout && (
        <AboutDialog item={selectedAbout} onClose={() => setSelectedAbout(null)} />
      )}
      {selectedProject && (
        <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </main>
  )
}

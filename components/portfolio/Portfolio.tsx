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
import { siteContent, type Project } from '@/content/site-content'

const ProjectDialog = dynamic(() => import('./ProjectDialog'), { ssr: false })

const aboutFragments = [
  {
    label: 'AI Research',
    caption: 'Steering model behavior at inference time without changing the weights.',
    className: 'fragment-one',
  },
  {
    label: 'Scale AI',
    caption: 'Pressure-testing frontier models, agents, and the systems around them.',
    className: 'fragment-two',
  },
  {
    label: 'Refraction',
    caption: 'Shipping a cross-platform AI nutrition product from architecture to telemetry.',
    className: 'fragment-three',
  },
  {
    label: 'Selected Work',
    caption: 'Products built where intelligent systems meet real human workflows.',
    className: 'fragment-four',
  },
  {
    label: 'UVA · CS',
    caption: 'Computer Science, systems, security, and machine learning research.',
    className: 'fragment-five',
  },
]

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

function useScrollExperience(fractureProgressRef: React.MutableRefObject<number>) {
  useEffect(() => {
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).get('motion') === 'reduce'
    if (reducedMotion) return

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
        ScrollTrigger.create({
          trigger: '#hero',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: ({ progress }) => {
            fractureProgressRef.current = progress
            document.documentElement.style.setProperty('--hero-progress', progress.toFixed(3))
          },
        })

        gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
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
        document.documentElement.style.removeProperty('--hero-progress')
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
  }, [fractureProgressRef])
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

function Hero({ fractureProgressRef }: { fractureProgressRef: React.MutableRefObject<number> }) {
  const letters = useMemo(() => siteContent.identity.name.split(''), [])

  return (
    <section id="hero" className="hero-shell" aria-label="Introduction">
      <div className="hero-stage">
        <HeroExperience fractureProgressRef={fractureProgressRef} />
        <div className="hero-wash" />
        <div className="hero-copy">
          <h1 aria-label="Brett Haas">
            {letters.map((letter, index) => (
              <span
                key={`${letter}-${index}`}
                aria-hidden="true"
                style={{ '--letter-index': index } as React.CSSProperties}
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
    </section>
  )
}

function AboutSection() {
  return (
    <section id="about" className="section about-section">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">01 · In pursuit</p>
        <h2>Ambition, with<br />an engineering plan.</h2>
        <p className="section-intro">{siteContent.identity.descriptor}</p>
      </div>
      <div className="ruins" data-reveal>
        {aboutFragments.map((fragment) => (
          <div
            className={`ruin-fragment ${fragment.className}`}
            key={fragment.label}
            tabIndex={0}
          >
            <span>{fragment.label}</span>
            <p>{fragment.caption}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProjectsSection({ onSelect }: { onSelect: (project: Project) => void }) {
  return (
    <section id="projects" className="section projects-section">
      <div className="section-heading split-heading" data-reveal>
        <div>
          <p className="eyebrow">02 · Made tangible</p>
          <h2>Selected Work</h2>
        </div>
        <p className="section-intro">
          Systems shaped around real-time collaboration, computer vision, and model behavior.
        </p>
      </div>
      <div className="monolith-grid">
        {siteContent.projects.map((project, index) => (
          <button
            aria-label={`Explore ${project.name}`}
            className="project-monolith physical-button"
            data-reveal
            key={project.id}
            onClick={() => onSelect(project)}
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

function SkillsSection() {
  const [activeNode, setActiveNode] = useState<number | null>(null)

  return (
    <section id="skills" className="section skills-section">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">03 · Connected systems</p>
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
    </section>
  )
}

function ExperienceSection() {
  return (
    <section id="experience" className="section experience-section">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">04 · The ascent</p>
        <h2>Experience</h2>
      </div>
      <div className="timeline">
        {siteContent.experience.map((entry) => (
          <article className="timeline-entry" data-reveal key={entry.id}>
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
          <article className="timeline-entry education-entry" data-reveal key={entry.degree}>
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
    <section className="ending-section" aria-label="Closing thought">
      <div className="ending-sky" />
      <div className="ending-sun" />
      <div className="ending-copy" data-reveal>
        <p>{siteContent.editorial.endingQuote}</p>
        <span>{siteContent.editorial.closingLine}</span>
      </div>
    </section>
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  useScrollExperience(fractureProgressRef)

  return (
    <main>
      <SiteNav />
      <Hero fractureProgressRef={fractureProgressRef} />
      <AboutSection />
      <ProjectsSection onSelect={setSelectedProject} />
      <SkillsSection />
      <ExperienceSection />
      <EndingSection />
      <Footer />
      {selectedProject && (
        <ProjectDialog project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </main>
  )
}

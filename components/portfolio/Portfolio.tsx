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
    const root = document.documentElement
    const reducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).get('motion') === 'reduce'
    if (reducedMotion) {
      root.dataset.motion = 'reduce'
      fractureProgressRef.current = 0
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
          const wipeClouds = gsap.utils.toArray<HTMLElement>('.cloud-wipe-slot')
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
                fractureProgressRef.current = progress
                root.style.setProperty('--hero-progress', progress.toFixed(3))
              },
            },
          })

          descentTimeline
            .to(
              '.hero-content',
              { autoAlpha: 0, yPercent: -8, scale: 1.055, duration: 0.7 },
              0,
            )
            .fromTo(
              '.cloud-layer-far',
              { xPercent: -4, yPercent: 84, scale: 0.9 },
              { xPercent: 3, yPercent: -128, scale: 1.08, duration: 0.78 },
              0.02,
            )
            .fromTo(
              '.cloud-layer-mid',
              { xPercent: 5, yPercent: 105, scale: 0.94 },
              { xPercent: -3, yPercent: -155, scale: 1.13, duration: 0.75 },
              0.08,
            )
            .fromTo(
              '.cloud-layer-near',
              { xPercent: -2, yPercent: 112, scale: 0.98 },
              { xPercent: 4, yPercent: -188, scale: 1.19, duration: 0.72 },
              0.14,
            )
            .fromTo(
              wipeClouds,
              {
                xPercent: (_, cloud) => Number(cloud.dataset.entryX),
                yPercent: (_, cloud) => Number(cloud.dataset.entryY),
                scale: 0.78,
              },
              {
                xPercent: 0,
                yPercent: 0,
                scale: 1,
                duration: 0.25,
                ease: 'power2.in',
                stagger: 0.001,
              },
              0.25,
            )
            .to(
              wipeClouds,
              {
                xPercent: (_, cloud) => Number(cloud.dataset.exitX),
                yPercent: (_, cloud) => Number(cloud.dataset.exitY),
                scale: 1.12,
                duration: 0.28,
                ease: 'power2.in',
                stagger: 0.0005,
              },
              0.55,
            )
            .fromTo(
              '[data-about-arrival]',
              { autoAlpha: 0, y: 64 },
              { autoAlpha: 1, y: 0, duration: 0.22, ease: 'power2.out' },
              0.78,
            )
        }

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

type CloudProfile = 'round' | 'tower' | 'wide'

const cloudProfiles: Record<CloudProfile, ReadonlyArray<readonly [number, number, number]>> = {
  round: [
    [50, 72, 38],
    [86, 52, 48],
    [128, 43, 55],
    [170, 56, 47],
    [202, 74, 34],
  ],
  tower: [
    [48, 76, 36],
    [82, 58, 45],
    [118, 35, 60],
    [158, 55, 48],
    [198, 75, 36],
  ],
  wide: [
    [42, 76, 34],
    [78, 61, 42],
    [116, 54, 48],
    [158, 58, 44],
    [202, 76, 35],
  ],
}

const ambientClouds: Record<
  'far' | 'mid' | 'near',
  ReadonlyArray<{ className: string; profile: CloudProfile }>
> = {
  far: [
    { className: 'cloud-far-one', profile: 'wide' },
    { className: 'cloud-far-two', profile: 'round' },
    { className: 'cloud-far-three', profile: 'tower' },
    { className: 'cloud-far-four', profile: 'wide' },
  ],
  mid: [
    { className: 'cloud-mid-one', profile: 'tower' },
    { className: 'cloud-mid-two', profile: 'wide' },
    { className: 'cloud-mid-three', profile: 'round' },
    { className: 'cloud-mid-four', profile: 'tower' },
  ],
  near: [
    { className: 'cloud-near-one', profile: 'round' },
    { className: 'cloud-near-two', profile: 'tower' },
    { className: 'cloud-near-three', profile: 'wide' },
    { className: 'cloud-near-four', profile: 'round' },
  ],
}

const profileCycle: ReadonlyArray<CloudProfile> = ['round', 'wide', 'tower']

const wipeClouds = Array.from({ length: 35 }, (_, index) => {
  const desktopColumn = index % 7
  const desktopRow = Math.floor(index / 7)
  const mobileColumn = index % 5
  const mobileRow = Math.floor(index / 5)
  const entrySide = index % 4

  return {
    entryX: entrySide === 0 ? -220 : entrySide === 1 ? 220 : (index % 5 - 2) * 18,
    entryY: entrySide === 2 ? -900 : entrySide === 3 ? 900 : (index % 3 - 1) * 30,
    exitX: (index % 7 - 3) * 12,
    exitY: -900 - (index % 4) * 55,
    profile: profileCycle[index % profileCycle.length],
    style: {
      '--cloud-left': `${-8 + desktopColumn * 16}vw`,
      '--cloud-top': `${-10 + desktopRow * 21}vh`,
      '--cloud-size': `${23 + (index % 4)}vw`,
      '--cloud-mobile-left': `${-28 + mobileColumn * 28}vw`,
      '--cloud-mobile-top': `${-7 + mobileRow * 15}vh`,
      '--cloud-mobile-size': `${60 + (index % 3) * 2}vw`,
    } as React.CSSProperties,
  }
})

function CloudPuff({ className, profile }: { className: string; profile: CloudProfile }) {
  return (
    <div className={`cloud-puff ${className}`}>
      <svg viewBox="0 0 240 124" focusable="false" preserveAspectRatio="xMidYMid meet">
        <ellipse className="cloud-underside" cx="120" cy="91" rx="108" ry="28" />
        <ellipse className="cloud-body" cx="120" cy="80" rx="110" ry="30" />
        {cloudProfiles[profile].map(([cx, cy, radius]) => (
          <circle className="cloud-body" cx={cx} cy={cy} r={radius} key={`${cx}-${cy}`} />
        ))}
        <ellipse className="cloud-highlight" cx="104" cy="62" rx="57" ry="25" />
      </svg>
    </div>
  )
}

function CloudDescent() {
  return (
    <div className="cloud-descent" data-cloud-descent aria-hidden="true">
      <div className="cloud-layer cloud-layer-far">
        {ambientClouds.far.map((cloud) => (
          <CloudPuff {...cloud} key={cloud.className} />
        ))}
      </div>
      <div className="cloud-layer cloud-layer-mid">
        {ambientClouds.mid.map((cloud) => (
          <CloudPuff {...cloud} key={cloud.className} />
        ))}
      </div>
      <div className="cloud-layer cloud-layer-near">
        {ambientClouds.near.map((cloud) => (
          <CloudPuff {...cloud} key={cloud.className} />
        ))}
      </div>
      <div className="cloud-wipe">
        {wipeClouds.map((cloud, index) => (
          <div
            className="cloud-wipe-slot"
            data-entry-x={cloud.entryX}
            data-entry-y={cloud.entryY}
            data-exit-x={cloud.exitX}
            data-exit-y={cloud.exitY}
            key={index}
            style={cloud.style}
          >
            <CloudPuff className="cloud-wipe-puff" profile={cloud.profile} />
          </div>
        ))}
      </div>
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
        <CloudDescent />
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section id="about" className="section about-section">
      <div className="section-heading" data-reveal data-about-arrival>
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

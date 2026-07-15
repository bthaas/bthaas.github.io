import { atlasVisuals, type AtlasVisual } from '@/content/editorial-visuals'
import {
  siteContent,
  type ExperienceEntry,
  type ProjectVisualKey,
} from '@/content/site-content'
import { getProjectDirection } from '@/lib/atlas-motion/project-choreography'

interface AtlasPictureProps {
  readonly visual: AtlasVisual
  readonly alt: string
  readonly className?: string
  readonly priority?: boolean
  readonly projectPan?: boolean
  readonly reveal?: boolean
  readonly sizes: string
}

const projectAlts: Record<ProjectVisualKey, string> = {
  courtvision: 'A geometric arena with analytical trajectory arcs',
  beatstream: 'Coastal architecture crossed by rhythmic signal ribbons',
  'vision-bias-steering': 'A labyrinth observatory with two controlled light paths',
}

function AtlasPicture({
  visual,
  alt,
  className,
  priority = false,
  projectPan = false,
  reveal = false,
  sizes,
}: AtlasPictureProps) {
  return (
    <picture
      className={className}
      data-cursor="read"
      data-project-pan={projectPan ? '' : undefined}
      data-reveal={reveal ? '' : undefined}
    >
      <source
        type="image/avif"
        srcSet={`${visual.smallSrc} ${visual.smallWidth}w, ${visual.src} ${visual.width}w`}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={`${visual.smallFallback} ${visual.smallWidth}w, ${visual.fallback} ${visual.width}w`}
        sizes={sizes}
      />
      <img
        src={visual.fallback}
        srcSet={`${visual.smallFallback} ${visual.smallWidth}w, ${visual.fallback} ${visual.width}w`}
        sizes={sizes}
        alt={alt}
        width={visual.width}
        height={visual.height}
        loading={priority ? undefined : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding={priority ? 'sync' : 'async'}
      />
    </picture>
  )
}

function CraftCapabilitySequence({
  capabilities,
  duplicate = false,
}: {
  readonly capabilities: readonly string[]
  readonly duplicate?: boolean
}) {
  return (
    <div className="craft-marquee__sequence" aria-hidden={duplicate || undefined}>
      {capabilities.map((capability) => (
        <span key={capability}>
          {capability} <span aria-hidden="true">·</span>
        </span>
      ))}
    </div>
  )
}

function FlightDossier({ entry }: { readonly entry: ExperienceEntry }) {
  const panelId = `flight-dossier-${entry.id}`

  return (
    <div className="flight-dossier" data-dossier data-state="open">
      <button
        className="flight-dossier__toggle"
        type="button"
        aria-controls={panelId}
        aria-expanded="true"
        aria-label="Field notes +"
        data-cursor="expand"
      >
        <span>Field notes</span>
        <span className="flight-dossier__symbol" aria-hidden="true">
          +
        </span>
      </button>
      <div className="flight-dossier__panel" id={panelId}>
        <div className="flight-dossier__inner">
          <ul className="flight-highlights">
            {entry.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <ul
            className="flight-technologies"
            aria-label={`${entry.organization} technologies`}
          >
            {entry.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function Portfolio() {
  const { identity, contact, featuredMetrics, experience, education, projects, craftCapabilities } =
    siteContent

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <nav className="site-nav atlas-shell" aria-label="Primary navigation">
          <a className="nav-name" href="#hero">
            Brett Haas
          </a>
          <div className="sun-arc" aria-hidden="true">
            <svg focusable="false" viewBox="0 0 240 32">
              <path className="sun-arc__track" d="M8 23 Q120 -5 232 23" />
              <path className="sun-arc__horizon" d="M220 23 H239 M232 18 V28" />
              <g data-atlas-sun transform="translate(0 0)">
                <circle className="sun-arc__halo" cx="8" cy="23" r="9" />
                <circle className="sun-arc__disc" cx="8" cy="23" r="6" />
              </g>
            </svg>
          </div>
          <div className="nav-links">
            <a href="#craft">Craft</a>
            <a href="#experience">Trajectory</a>
            <a href="#projects">Work</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero-section atlas-shell" id="hero" aria-labelledby="hero-name">
          <div className="board-meta hero-meta" aria-label="Portfolio introduction">
            <p>Portfolio / 2026</p>
            <p>{identity.title}</p>
            <p>{identity.location}</p>
          </div>

          <div className="hero-art">
            <AtlasPicture
              visual={atlasVisuals.hero}
              alt="A geometric Aegean city aligned with a rising sun"
              className="atlas-picture atlas-picture--hero"
              sizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
              priority
            />
            <p className="art-caption art-caption--light">Plate 01 / Ambition needs systems</p>
          </div>

          <div className="hero-copy-release">
            <div className="hero-copy editorial-grid">
              <div className="hero-identity">
                <p className="eyebrow">Engineer · Researcher · Builder</p>
                <h1 data-atlas-masthead id="hero-name">{identity.name}</h1>
              </div>
              <div className="hero-statement">
                <h2>I build intelligent systems that hold up in the real world.</h2>
                <p>{identity.descriptor}</p>
                <a className="text-link" href="#projects">
                  Explore selected work <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>

          <div className="signal-strip" aria-label="Selected verified results">
            {featuredMetrics.map((metric) => {
              const source = experience.find(({ id }) => id === metric.sourceId)
              return (
                <div className="signal-metric" data-testid="featured-metric" key={metric.value}>
                  <strong data-atlas-count data-testid="metric-value">{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{source?.organization}</small>
                </div>
              )
            })}
          </div>
        </section>

        <section
          className="craft-section chapter-wipe chapter-wipe--ltr"
          id="craft"
          aria-labelledby="craft-title"
          data-chapter-wipe
          data-wipe-direction="ltr"
        >
          <div className="atlas-shell craft-layout">
            <div className="craft-narrative editorial-grid">
              <div className="section-heading craft-heading">
                <span className="craft-ghost" data-craft-ghost aria-hidden="true">
                  01
                </span>
                <p className="eyebrow">01 / Craft</p>
                <h2 id="craft-title">The craft behind the flight.</h2>
              </div>
              <div className="craft-copy">
                <p className="lede">
                  My work sits where software engineering, machine learning, and product judgment
                  meet.
                </p>
                <p>
                  I like difficult systems with visible stakes: steering model behavior, testing
                  frontier agents, and shipping cross-platform products whose performance can be
                  measured—not merely described.
                </p>
              </div>
            </div>
            <div className="craft-plate-row editorial-grid">
              <AtlasPicture
                visual={atlasVisuals.craft}
                alt="A cliffside workshop with sculptural wings"
                className="atlas-picture craft-art"
                sizes="(max-width: 720px) 100vw, 66vw"
              />
              <div className="craft-notes" aria-label="Core capabilities">
                {craftCapabilities.map((capability) => (
                  <p key={capability}>{capability}</p>
                ))}
              </div>
            </div>
          </div>
          <div
            className="craft-marquee"
            data-craft-marquee
            aria-label="Core capabilities ticker; focus to pause"
            tabIndex={0}
          >
            <div className="craft-marquee__track">
              <CraftCapabilitySequence capabilities={craftCapabilities} />
              <CraftCapabilitySequence capabilities={craftCapabilities} duplicate />
            </div>
          </div>
        </section>

        <section className="experience-section" id="experience" aria-labelledby="experience-title">
          {[1, 2, 3].map((step) => (
            <span
              className="experience-light-step"
              data-experience-light-step={step}
              aria-hidden="true"
              key={step}
            />
          ))}
          <div className="atlas-shell">
            <div className="experience-intro editorial-grid">
              <div className="section-heading">
                <p className="eyebrow">02 / Flight log</p>
                <h2 id="experience-title">Trajectory</h2>
              </div>
              <p className="experience-kicker">
                From research and evaluation to production mobile systems: a path shaped by rigor,
                iteration, and useful outcomes.
              </p>
            </div>

            <div className="experience-plate frame-reveal" data-reveal>
              <AtlasPicture
                visual={atlasVisuals.experience}
                alt="A rising coastal city and lighthouse at dusk"
                className="atlas-picture experience-art"
                sizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
              />
              <span className="experience-plate__warmth" aria-hidden="true" />
            </div>

            <div
              className="flight-log"
              role="list"
              aria-label="Professional experience"
              data-reveal-stagger
            >
              {experience.map((entry, index) => (
                <article className="flight-entry" role="listitem" key={entry.id}>
                  <p className="flight-index">{String(index + 1).padStart(2, '0')}</p>
                  <div className="flight-heading">
                    <h3>{entry.organization}</h3>
                    <p className="flight-role">
                      {entry.role}
                      {entry.team ? ` · ${entry.team}` : ''}
                    </p>
                  </div>
                  <p className="flight-summary">{entry.summary}</p>
                  <p className="flight-period">
                    {entry.period}
                    <span>{entry.location}</span>
                  </p>
                  <FlightDossier entry={entry} />
                </article>
              ))}
              {education.map((entry) => (
                <article className="flight-entry flight-entry--education" role="listitem" key={entry.degree}>
                  <p className="flight-index">04</p>
                  <div className="flight-heading">
                    <h3>{entry.institution}</h3>
                    <p className="flight-role">{entry.degree}</p>
                  </div>
                  <p className="flight-summary">
                    Systems, cybersecurity, software engineering, and machine-learning research.
                  </p>
                  <p className="flight-period">
                    {entry.graduation}
                    <span>GPA {entry.gpa}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="projects-section" id="projects" aria-labelledby="projects-title">
          <div className="atlas-shell projects-intro editorial-grid">
            <div className="section-heading">
              <p className="eyebrow">03 / Field studies</p>
              <h2 id="projects-title">Selected work</h2>
            </div>
            <p>
              Three builds across computer vision, product interface, and language-model research.
              Each chapter is presented in full—no hidden cards or modal detours.
            </p>
          </div>

          <div className="project-chapters">
            {projects.map((project, index) => (
              <article
                className={`project-chapter project-chapter--${index + 1} chapter-wipe chapter-wipe--${getProjectDirection(index)}`}
                data-testid="project-case-study"
                data-chapter-wipe
                data-wipe-direction={getProjectDirection(index)}
                id={`project-${project.id}`}
                key={project.id}
              >
                <div className="atlas-shell project-grid">
                  <div className="project-meta" data-reveal-stagger>
                    <p className="eyebrow project-case-label">
                      Case {String(index + 1).padStart(2, '0')}
                    </p>
                    <p className="project-tech-list">{project.technologies.join(' · ')}</p>
                  </div>

                  <div className="project-title">
                    <h3>{project.name}</h3>
                    <p>{project.description}</p>
                  </div>

                  <AtlasPicture
                    visual={atlasVisuals.projects[project.visualKey]}
                    alt={projectAlts[project.visualKey]}
                    className="atlas-picture project-art frame-reveal"
                    projectPan
                    reveal
                    sizes="(max-width: 720px) 100vw, 58vw"
                  />

                  <div className="case-study-copy" data-reveal-stagger>
                    <div>
                      <h4>Brief</h4>
                      <p>{project.caseStudy.brief}</p>
                    </div>
                    <div>
                      <h4>Approach</h4>
                      <p>{project.caseStudy.approach}</p>
                    </div>
                    <div>
                      <h4>Technical focus</h4>
                      <p>{project.caseStudy.focus}</p>
                    </div>
                  </div>

                  <a
                    className="repository-link"
                    href={project.links.repository}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`View ${project.name} repository`}
                    data-magnetic
                  >
                    Repository <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          className="contact-section"
          id="contact"
          aria-labelledby="contact-title"
          data-contact-finale
        >
          <div className="atlas-shell contact-board">
            <div className="contact-plate">
              <AtlasPicture
                visual={atlasVisuals.ending}
                alt="A calm sunrise horizon between distant mountain ridges"
                className="atlas-picture contact-art frame-reveal"
                reveal
                sizes="(max-width: 720px) 100vw, calc(100vw - 64px)"
              />
              <span className="contact-sunrise" data-contact-sunrise aria-hidden="true" />
            </div>
            <div className="contact-copy editorial-grid">
              <div>
                <p className="eyebrow">04 / Next horizon</p>
                <h2 id="contact-title" data-contact-title>Keep building.</h2>
              </div>
              <div>
                <p>
                  I’m interested in ambitious engineering teams working across intelligent systems,
                  reliable products, and applied research.
                </p>
                <a className="contact-email" href={`mailto:${contact.email}`} data-magnetic>
                  Email Brett <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <footer className="site-footer">
              <p>© 2026 Brett Haas</p>
              <p data-atlas-local-time aria-label="Local time in Charlottesville, Virginia">
                Charlottesville, VA
              </p>
              <div>
                <a href={contact.github} target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <a href={contact.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </div>
              <a href="#hero">
                Back to top <span aria-hidden="true">↑</span>
              </a>
            </footer>
          </div>
        </section>
      </main>
    </>
  )
}

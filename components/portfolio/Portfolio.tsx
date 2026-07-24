import { atlasVisuals } from '@/content/editorial-visuals'
import { AtlasMotionEffects } from '@/components/motion/AtlasMotionEffects'
import { FlightTiltSurface } from '@/components/motion/FlightTiltSurface'
import { HeroMasthead } from '@/components/motion/HeroMasthead'
import { SunBadge } from '@/components/motion/SunBadge'
import { ProjectsSpiral } from '@/components/projects/ProjectsSpiral'
import { HeroLiquidPlate } from '@/components/scenes/HeroLiquidPlate'
import {
  siteContent,
  type ExperienceEntry,
} from '@/content/site-content'

import { AtlasPicture } from './AtlasPicture'
import {
  getSkillLogos,
  SkillLogoGrid,
  SkillLogoSequence,
} from './SkillLogos'
import { SkillSphere } from './SkillSphere'
import { PortfolioGateway } from './PortfolioGateway'

type ContactIconName = 'email' | 'github' | 'linkedin'

function ContactIcon({ name }: { readonly name: ContactIconName }) {
  if (name === 'github') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.24c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.38.97.1-.75.4-1.27.74-1.56-2.58-.3-5.29-1.29-5.29-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.72 5.39-5.3 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"
        />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S.02 4.88.02 3.5 1.13 1 2.5 1s2.48 1.12 2.48 2.5ZM.26 8h4.48v14H.26V8Zm7.16 0h4.29v1.91h.06c.6-1.13 2.06-2.33 4.24-2.33 4.53 0 5.37 2.98 5.37 6.86V22H16.9v-6.7c0-1.6-.03-3.66-2.23-3.66-2.23 0-2.57 1.74-2.57 3.54V22H7.42V8Z"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path
        d="M3 5.5h18v13H3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m4 6.5 8 6 8-6"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
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

function FlightRule() {
  return (
    <svg
      className="flight-rule"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 100 1"
    >
      <line data-flight-rule x1="0" y1="0.5" x2="100" y2="0.5" />
    </svg>
  )
}

export function Portfolio() {
  const { identity, contact, experience, education, projects, skills } = siteContent
  const skillLogos = getSkillLogos(skills)

  return (
    <>
      <AtlasMotionEffects />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="site-header">
        <nav className="site-nav atlas-shell" aria-label="Primary navigation">
          <a className="nav-name" href="#hero">
            <img
              className="nav-name__mark"
              src="/original-wing-filled.png"
              alt=""
              width="128"
              height="128"
              aria-hidden="true"
            />
            Brett Haas
          </a>
          <SunBadge />
          <div className="nav-links">
            <a href="#experience">Experience</a>
            <a href="#projects">Projects</a>
            <a href="#craft">Skills</a>
            <a href="#contact">Contact</a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className="hero-section atlas-shell" id="hero" aria-labelledby="hero-name">
          <div className="board-meta hero-meta" role="group" aria-label="Portfolio introduction">
            <p>Portfolio / 2026</p>
            <p>{identity.title}</p>
            <p>{identity.location}</p>
          </div>

          <HeroLiquidPlate />

          <div className="hero-copy-release">
            <div className="hero-copy editorial-grid">
              <div className="hero-identity">
                <HeroMasthead name={identity.name} />
              </div>
              <div
                className="hero-actions"
                role="group"
                aria-label="Portfolio roles and projects"
              >
                <p className="eyebrow">Engineer · Researcher · Builder</p>
                <a className="hero-projects-link" href="#projects">
                  <span>Explore projects</span>
                  <span className="hero-projects-link__arrow" aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>

        </section>

        <PortfolioGateway />

        <section className="experience-section" id="experience" aria-labelledby="experience-title">
          <div className="experience-board">
            <div
              className="experience-plate experience-plate--inset frame-reveal"
              data-atlas-plate-sheen
              data-reveal
            >
              <AtlasPicture
                visual={atlasVisuals.experience}
                alt="A rising coastal city and lighthouse at dusk"
                className="atlas-picture experience-art"
                cursor="read"
                sizes="(max-width: 720px) 100vw, 50vw"
                velocityPlate
              />
              <span className="experience-plate__warmth" aria-hidden="true" />
            </div>
            <div className="experience-panel">
              <div className="experience-intro">
                <div className="section-heading">
                  <p className="eyebrow">01 / Flight log</p>
                  <h2 id="experience-title">Experience</h2>
                </div>
                <p className="experience-kicker">
                  From research and evaluation to production mobile systems: a path shaped by
                  rigor, iteration, and useful outcomes.
                </p>
              </div>
            </div>
          </div>

          <div className="atlas-shell experience-log-shell">
            <ol
              className="flight-log"
              aria-label="Professional experience"
              data-reveal-stagger
            >
              {experience.map((entry, index) => (
                <li className="flight-entry" key={entry.id}>
                  <FlightTiltSurface>
                    <FlightRule />
                    <p className="flight-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </p>
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
                  </FlightTiltSurface>
                </li>
              ))}
              {education.map((entry) => (
                <li className="flight-entry flight-entry--education" key={entry.degree}>
                  <FlightTiltSurface>
                    <FlightRule />
                    <p className="flight-index" aria-hidden="true">04</p>
                    <div className="flight-heading">
                      <h3>{entry.institution}</h3>
                      <p className="flight-role">{entry.degree}</p>
                    </div>
                    <p className="flight-summary flight-summary--education">
                      <span>GPA: {entry.gpa}</span>
                      <span>Relevant coursework: {entry.coursework.join(', ')}</span>
                    </p>
                    <p className="flight-period">
                      {entry.graduation}
                      <span>{entry.location}</span>
                    </p>
                  </FlightTiltSurface>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="projects-section" id="projects" aria-labelledby="projects-title">
          <div className="atlas-shell projects-intro editorial-grid">
            <div className="section-heading">
              <p className="eyebrow">02 / Field studies</p>
              <h2 id="projects-title">Projects</h2>
            </div>
            <p>
              Three builds across computer vision, real-time collaboration, and language-model
              research. Follow the spiral and choose a project to open its complete case study.
            </p>
          </div>

          <ProjectsSpiral projects={projects} />

        </section>

        <section
          className="craft-section"
          id="craft"
          aria-labelledby="craft-title"
        >
          <div className="craft-board">
            <div
              className="craft-plate craft-plate--inset"
              data-atlas-plate-sheen
              data-atlas-velocity-plate
            >
              <AtlasPicture
                visual={atlasVisuals.craft}
                alt="A cliffside workshop with sculptural wings"
                className="atlas-picture craft-art"
                cursor="read"
                printReveal
                sizes="(max-width: 720px) 100vw, 50vw"
              />
            </div>
            <div className="craft-panel">
              <div className="craft-narrative">
                <div className="section-heading craft-heading">
                  <span className="craft-ghost" data-craft-ghost="03" aria-hidden="true" />
                  <p className="eyebrow">03 / Skills</p>
                  <h2 id="craft-title">The skills behind the flight.</h2>
                </div>
                <div className="craft-copy">
                  <p className="lede">
                    My work sits where software engineering, machine learning, and product
                    judgment meet.
                  </p>
                  <p>
                    I like difficult systems with visible stakes: steering model behavior, testing
                    frontier agents, and shipping cross-platform products whose performance can be
                    measured—not merely described.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <SkillSphere logos={skillLogos} />
          <noscript>
            <div className="skill-sphere-noscript">
              <SkillLogoGrid logos={skillLogos} />
            </div>
          </noscript>
          <div
            className="craft-marquee"
            data-craft-marquee
            role="region"
            aria-label="Technology logo ticker; focus to pause"
            tabIndex={0}
          >
            <div className="craft-marquee__track">
              <SkillLogoSequence logos={skillLogos} />
              <SkillLogoSequence logos={skillLogos} duplicate />
            </div>
          </div>
        </section>

        <section
          className="contact-section"
          id="contact"
          aria-labelledby="contact-title"
          data-contact-finale
        >
          <div className="contact-board">
            <div className="contact-plate contact-plate--inset" data-atlas-plate-sheen>
              <AtlasPicture
                visual={atlasVisuals.ending}
                alt="A calm sunrise horizon between distant mountain ridges"
                className="atlas-picture contact-art frame-reveal"
                cursor="read"
                reveal
                sizes="(max-width: 720px) 100vw, 50vw"
              />
              <div className="contact-flock" data-horizon-flock aria-hidden="true" />
              <span className="contact-sunrise" data-contact-sunrise aria-hidden="true" />
            </div>
            <div className="contact-panel">
              <div className="contact-copy">
                <p className="eyebrow" data-contact-detail>04 / Next horizon</p>
                <h2 id="contact-title" data-contact-title>Connect with me.</h2>
                <p className="contact-intro" data-contact-detail>
                  Always open to a conversation about interesting ideas, thoughtful products, and
                  the systems that make them work.
                </p>
                <nav className="contact-links" aria-label="Contact links">
                  <span
                    className="contact-golden-feather"
                    data-golden-feather-target
                    aria-hidden="true"
                  >
                    <svg focusable="false" viewBox="0 0 24 64">
                      <path d="M12 62C10 47 5 32 7 17 8 9 12 3 18 2c2 15-2 29-12 39" />
                      <path d="M12 62c0-18 1-34 5-51M10 24l7-7M9 33l7-6M10 42l4-3" />
                    </svg>
                  </span>
                  <a
                    className="contact-link"
                    href={`mailto:${contact.email}`}
                    aria-label="Email Brett"
                    title="Email Brett"
                    data-contact-detail
                    data-magnetic
                  >
                    <ContactIcon name="email" />
                  </a>
                  <a
                    className="contact-link"
                    href={contact.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                    title="GitHub"
                    data-contact-detail
                    data-magnetic
                  >
                    <ContactIcon name="github" />
                  </a>
                  <a
                    className="contact-link"
                    href={contact.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    title="LinkedIn"
                    data-contact-detail
                    data-magnetic
                  >
                    <ContactIcon name="linkedin" />
                  </a>
                </nav>
              </div>

              <footer className="site-footer" data-contact-detail>
                <p>© 2026 Brett Haas</p>
                <p
                  data-atlas-local-time
                  role="timer"
                  aria-label="Local time in Bellevue, Washington"
                >
                  Bellevue, WA
                </p>
                <a href="#hero">
                  Back to top <span aria-hidden="true">↑</span>
                </a>
              </footer>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

'use client'

import { type CSSProperties, useRef } from 'react'

import { AtlasPicture } from '@/components/portfolio/AtlasPicture'
import { atlasVisuals } from '@/content/editorial-visuals'
import type { EducationEntry, ExperienceEntry } from '@/content/site-content'
import { buildExperienceTimeline } from '@/lib/experience-flight-path'

interface ExperienceFlightPathProps {
  readonly education: readonly EducationEntry[]
  readonly experience: readonly ExperienceEntry[]
}

type TimelineStyle = CSSProperties & {
  '--experience-stop-count': number
}

type TimelineLaneStyle = CSSProperties & {
  '--experience-lane-end': string
  '--experience-lane-index': number
  '--experience-lane-start': string
}

type TimelinePositionStyle = CSSProperties & {
  '--experience-position': string
}

type TimelineStop =
  | {
      readonly entry: ExperienceEntry
      readonly id: string
      readonly kind: 'experience'
      readonly label: string
      readonly location: string | null
      readonly period: string
      readonly role: string
    }
  | {
      readonly entry: EducationEntry
      readonly id: string
      readonly kind: 'education'
      readonly label: string
      readonly location: string
      readonly period: string
      readonly role: string
    }

function ExperienceDetails({ entry }: { readonly entry: ExperienceEntry }) {
  return (
    <>
      <div className="experience-timeline__summary">
        <p className="experience-timeline__details-label">Role description</p>
        <p>{entry.summary}</p>
      </div>
      <div className="experience-timeline__evidence">
        <div>
          <h4>Selected impact</h4>
          <ul className="experience-timeline__highlights">
            {entry.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Working set</h4>
          <ul
            className="experience-timeline__tags"
            aria-label={`${entry.organization} technologies`}
          >
            {entry.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

function EducationDetails({ entry }: { readonly entry: EducationEntry }) {
  return (
    <>
      <div className="experience-timeline__summary">
        <p className="experience-timeline__details-label">Academic details</p>
        <p className="experience-timeline__gpa">GPA {entry.gpa}</p>
      </div>
      <div className="experience-timeline__evidence">
        <div>
          <h4>Coursework</h4>
          <ul
            className="experience-timeline__tags experience-timeline__tags--courses"
            aria-label={`${entry.institution} coursework`}
          >
            {entry.coursework.map((course) => (
              <li key={course}>{course}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Focus areas</h4>
          <ul
            className="experience-timeline__tags"
            aria-label={`${entry.institution} focus areas`}
          >
            {entry.focusAreas.map((focus) => (
              <li key={focus}>{focus}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export function ExperienceFlightPath({
  education,
  experience,
}: ExperienceFlightPathProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const timeline = buildExperienceTimeline(experience, education)
  const stops: readonly TimelineStop[] = [
    ...experience.map((entry) => ({
      entry,
      id: entry.id,
      kind: 'experience' as const,
      label: entry.organization,
      location: entry.location,
      period: entry.period,
      role: entry.team ? `${entry.role} · ${entry.team}` : entry.role,
    })),
    ...education.map((entry, index) => ({
      entry,
      id:
        timeline.items[experience.length + index]?.id
        ?? `education-${index + 1}`,
      kind: 'education' as const,
      label: entry.institution,
      location: entry.location,
      period: entry.graduation,
      role: entry.degree,
    })),
  ]

  return (
    <div
      className="experience-timeline"
      data-experience-flight
      ref={rootRef}
    >
      <div className="experience-timeline__atmosphere" aria-hidden="true">
        <AtlasPicture
          visual={atlasVisuals.experience}
          alt=""
          className="atlas-picture experience-timeline__art"
          sizes="100vw"
        />
        <span className="experience-timeline__shade" />
        <span className="experience-timeline__glow" />
      </div>

      <header className="experience-timeline__intro atlas-shell">
        <div>
          <p className="eyebrow">01 / Career trajectory</p>
          <h2 id="experience-title">Experience</h2>
        </div>
        <div className="experience-timeline__intro-copy">
          <p>
            One shared route, three overlapping tenures, and one academic
            milestone. Hover or focus a line to identify it.
          </p>
          <p>Every company and role remains visible in the columns below.</p>
        </div>
      </header>

      <section
        className="experience-timeline__ledger atlas-shell"
        aria-label="Career timeline"
      >
        <nav
          aria-label="Experience date map"
          className="experience-timeline__map"
          id="experience-duration-map"
        >
          <div className="experience-timeline__map-meta">
            <span>{timeline.startLabel} — {timeline.endLabel}</span>
            <span>Hover or focus a line</span>
          </div>

          <div className="experience-timeline__plot">
            <div
              aria-label={`Timeline from ${timeline.startLabel} to ${timeline.endLabel}`}
              className="experience-timeline__spine"
            >
              <span className="experience-timeline__spine-line" aria-hidden="true" />
              {timeline.markers.map((marker) => (
                <i
                  className="experience-timeline__axis-marker"
                  key={`${marker.label}-${marker.position}`}
                  style={{ left: `${marker.position * 100}%` }}
                >
                  <span>{marker.label}</span>
                </i>
              ))}

              {stops.slice(experience.length).map((stop, educationIndex) => {
                const item = timeline.items[experience.length + educationIndex]
                if (!item) return null

                return (
                  <a
                    aria-label={`${stop.role} at ${stop.label}, ${stop.period}`}
                    className="experience-timeline__milestone"
                    href={`#experience-stop-${stop.id}`}
                    key={`milestone-${item.id}`}
                    style={{
                      '--experience-position': `${item.end * 100}%`,
                    } as TimelinePositionStyle}
                  >
                    <span
                      aria-hidden="true"
                      className="experience-timeline__milestone-star"
                    >
                      ✦
                    </span>
                    <span
                      aria-hidden="true"
                      className="experience-timeline__line-tooltip experience-timeline__line-tooltip--milestone"
                    >
                      <strong>{stop.label}</strong>
                      <span>{stop.role} · {stop.period}</span>
                    </span>
                  </a>
                )
              })}
            </div>

            <ol
              aria-label="Professional duration lines"
              className="experience-timeline__duration-lines"
            >
              {stops.slice(0, experience.length).map((stop, index) => {
                const item = timeline.items[index]
                if (!item) return null

                const accessibleRole = stop.kind === 'experience'
                  ? stop.entry.role
                  : stop.role

                return (
                  <li
                    className="experience-timeline__duration-line"
                    key={`duration-${item.id}`}
                    style={{
                      '--experience-lane-end': `${item.end * 100}%`,
                      '--experience-lane-index': index,
                      '--experience-lane-start': `${item.start * 100}%`,
                    } as TimelineLaneStyle}
                  >
                    <a
                      aria-label={`${accessibleRole} at ${stop.label}, ${stop.period}`}
                      className="experience-timeline__duration-link"
                      href={`#experience-stop-${stop.id}`}
                    >
                      <i
                        aria-hidden="true"
                        className="experience-timeline__duration-bar"
                      />
                      <span
                        aria-hidden="true"
                        className="experience-timeline__line-tooltip"
                      >
                        <strong>{stop.label}</strong>
                        <span>{stop.role} · {stop.period}</span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        </nav>

        <div className="experience-timeline__rail">
          <ol
            className="experience-timeline__list"
            aria-label="Professional experience and education"
            style={{
              '--experience-stop-count': stops.length,
            } as TimelineStyle}
          >
            {stops.map((stop, index) => {
              const detailsId = `experience-details-${stop.id}`
              const headingId = `experience-heading-${stop.id}`
              const accessibleRole = stop.kind === 'experience'
                ? stop.entry.role
                : stop.role
              const toggleLabel = `Details for ${accessibleRole} at ${stop.label}`

              return (
                <li
                  className="experience-timeline__stop"
                  data-experience-chapter
                  data-kind={stop.kind}
                  id={`experience-stop-${stop.id}`}
                  key={stop.id}
                >
                  <article aria-labelledby={headingId}>
                    <details data-stop-id={stop.id} name="experience-timeline">
                      <summary
                        className="experience-timeline__stop-header"
                        aria-controls={detailsId}
                        aria-label={toggleLabel}
                        onClick={() => {
                          rootRef.current
                            ?.querySelectorAll<HTMLDetailsElement>('details[open]')
                            .forEach((disclosure) => {
                              if (disclosure.dataset.stopId !== stop.id) {
                                disclosure.open = false
                              }
                            })
                        }}
                      >
                        <span className="experience-timeline__node" aria-hidden="true">
                          <span>{String(index + 1).padStart(2, '0')}</span>
                          {stop.entry.logo ? (
                            <img
                              src={stop.entry.logo}
                              alt=""
                              width="64"
                              height="64"
                            />
                          ) : (
                            <i className="experience-timeline__node-mark" />
                          )}
                        </span>

                        <span className="experience-timeline__identity">
                          <span>{stop.role}</span>
                          <span id={headingId} role="heading" aria-level={3}>
                            {stop.label}
                          </span>
                        </span>

                        <span className="experience-timeline__period">
                          <span>Tenure</span>
                          {stop.period}
                        </span>

                        <span className="experience-timeline__location">
                          <span>Location</span>
                          {stop.location ?? '—'}
                        </span>

                        <span
                          className="experience-timeline__toggle"
                          aria-hidden="true"
                        >
                          <span className="experience-timeline__toggle-closed">Details</span>
                          <span className="experience-timeline__toggle-open">Close</span>
                          <i />
                        </span>
                      </summary>

                      <div
                        className="experience-timeline__details"
                        id={detailsId}
                      >
                        {stop.kind === 'experience'
                          ? <ExperienceDetails entry={stop.entry} />
                          : <EducationDetails entry={stop.entry} />}
                      </div>
                    </details>
                  </article>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </div>
  )
}

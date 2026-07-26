'use client'

import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  type CSSProperties,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AtlasPicture } from '@/components/portfolio/AtlasPicture'
import { atlasVisuals } from '@/content/editorial-visuals'
import type { EducationEntry, ExperienceEntry } from '@/content/site-content'
import {
  buildExperienceTimeline,
  getExperienceChapterScrollY,
} from '@/lib/experience-flight-path'

gsap.registerPlugin(useGSAP, ScrollTrigger)

interface ExperienceFlightPathProps {
  readonly education: readonly EducationEntry[]
  readonly experience: readonly ExperienceEntry[]
}

interface PinMetrics {
  readonly pinDistance: number
  readonly pinStart: number
}

type TimelineStyle = CSSProperties & {
  '--experience-end'?: string
  '--experience-position'?: string
  '--experience-start'?: string
}

const HEADER_OFFSET = 58
const DESKTOP_QUERY =
  '(min-width: 960px) and (prefers-reduced-motion: no-preference)'

function chapterId(id: string) {
  return `experience-chapter-${id}`
}

export function ExperienceFlightPath({
  education,
  experience,
}: ExperienceFlightPathProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const activeIndexRef = useRef(0)
  const pinMetricsRef = useRef<PinMetrics>({ pinDistance: 0, pinStart: 0 })
  const [activeIndex, setActiveIndex] = useState(0)
  const timeline = useMemo(
    () => buildExperienceTimeline(experience, education),
    [education, experience],
  )
  const chapterCount = timeline.items.length

  const scrollToChapter = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      if (!window.matchMedia(DESKTOP_QUERY).matches) return false
      const metrics = pinMetricsRef.current
      if (metrics.pinDistance <= 0) return false
      window.scrollTo({
        behavior,
        top: getExperienceChapterScrollY({
          count: chapterCount,
          headerOffset: HEADER_OFFSET,
          index,
          pinDistance: metrics.pinDistance,
          pinStart: metrics.pinStart,
        }),
      })
      return true
    },
    [chapterCount],
  )

  const handleRouteClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, index: number) => {
      if (!scrollToChapter(index)) return
      event.preventDefault()
      window.history.pushState(null, '', event.currentTarget.hash)
    },
    [scrollToChapter],
  )

  useEffect(() => {
    const handleHash = () => {
      const index = timeline.items.findIndex(
        ({ id }) => window.location.hash === `#${chapterId(id)}`,
      )
      if (index < 0) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToChapter(index, 'auto'))
      })
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [scrollToChapter, timeline.items])

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = stageRef.current
      const viewport = viewportRef.current
      const track = trackRef.current
      if (!root || !stage || !viewport || !track || chapterCount < 2) return

      const media = gsap.matchMedia()
      media.add(DESKTOP_QUERY, () => {
        root.dataset.experienceFlightEnhanced = ''
        const getTravel = () =>
          Math.max(0, track.scrollWidth - viewport.clientWidth)
        const getPinDistance = () =>
          Math.max(getTravel(), window.innerHeight * 2.4)
        const tween = gsap.to(track, {
          ease: 'none',
          x: () => -getTravel(),
          scrollTrigger: {
            anticipatePin: 1,
            end: () => `+=${getPinDistance()}`,
            invalidateOnRefresh: true,
            pin: stage,
            scrub: 0.7,
            start: `top top+=${HEADER_OFFSET}`,
            onRefresh: () => {
              pinMetricsRef.current = {
                pinDistance: getPinDistance(),
                pinStart: stage.getBoundingClientRect().top + window.scrollY,
              }
            },
            onUpdate: ({ progress }) => {
              root.style.setProperty('--experience-flight-progress', String(progress))
              const nextIndex = Math.round(progress * (chapterCount - 1))
              if (nextIndex === activeIndexRef.current) return
              activeIndexRef.current = nextIndex
              setActiveIndex(nextIndex)
            },
          },
        })

        return () => {
          tween.scrollTrigger?.kill()
          tween.kill()
          gsap.set(track, { clearProps: 'transform' })
          root.style.removeProperty('--experience-flight-progress')
          delete root.dataset.experienceFlightEnhanced
          pinMetricsRef.current = { pinDistance: 0, pinStart: 0 }
        }
      })

      return () => media.revert()
    },
    { scope: rootRef },
  )

  return (
    <div className="experience-flight" ref={rootRef} data-experience-flight>
      <div className="experience-flight__stage" ref={stageRef}>
        <div className="experience-flight__atmosphere">
          <AtlasPicture
            visual={atlasVisuals.experience}
            alt="A rising coastal city and lighthouse at dusk"
            className="atlas-picture experience-flight__art"
            cursor="read"
            sizes="100vw"
          />
          <span className="experience-flight__shade" aria-hidden="true" />
          <span className="experience-flight__haze" aria-hidden="true" />
        </div>

        <header className="experience-flight__intro atlas-shell">
          <div>
            <p className="eyebrow">01 / Career trajectory</p>
            <h2 id="experience-title">Experience</h2>
          </div>
          <p>
            From research and evaluation to production mobile systems—a path shaped
            by rigor, iteration, and useful outcomes.
          </p>
        </header>

        <nav
          className="experience-flight__route atlas-shell"
          aria-label="Career timeline"
        >
          <div className="experience-flight__axis" aria-hidden="true">
            <span className="experience-flight__axis-line" />
            <span className="experience-flight__axis-progress" />
            {timeline.markers.map((marker) => (
              <span
                className="experience-flight__marker"
                key={marker.label}
                style={{
                  '--experience-position': `${marker.position * 100}%`,
                } as TimelineStyle}
              >
                {marker.label}
              </span>
            ))}
          </div>
          <ol className="experience-flight__route-items">
            {timeline.items.map((item, index) => (
              <li
                className={`experience-flight__route-item experience-flight__route-item--${item.kind}`}
                key={item.id}
                style={{
                  '--experience-end': `${item.end * 100}%`,
                  '--experience-start': `${item.start * 100}%`,
                } as TimelineStyle}
              >
                <a
                  href={`#${chapterId(item.id)}`}
                  aria-current={activeIndex === index ? 'step' : undefined}
                  onClick={(event) => handleRouteClick(event, index)}
                  onFocus={() => scrollToChapter(index)}
                >
                  <span>{item.label}</span>
                  <span>{item.period}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="experience-flight__viewport" ref={viewportRef}>
          <ol
            className="experience-flight__chapters"
            aria-label="Professional experience and education"
            ref={trackRef}
          >
            {experience.map((entry, index) => (
              <li className="experience-flight__chapter-wrap" key={entry.id}>
                <article
                  className="experience-flight__chapter"
                  data-active={activeIndex === index ? '' : undefined}
                  data-experience-chapter
                  id={chapterId(entry.id)}
                  aria-labelledby={`experience-heading-${entry.id}`}
                >
                  <header className="experience-flight__chapter-heading">
                    {entry.logo ? (
                      <img src={entry.logo} alt="" width="64" height="64" />
                    ) : (
                      <span className="experience-flight__chapter-mark" aria-hidden="true" />
                    )}
                    <p aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
                    <div>
                      <p>{entry.role}{entry.team ? ` · ${entry.team}` : ''}</p>
                      <h3 id={`experience-heading-${entry.id}`}>
                        {entry.organization}
                      </h3>
                    </div>
                    <p>
                      <span>{entry.period}</span>
                      {entry.location ? <span>{entry.location}</span> : null}
                    </p>
                  </header>
                  {entry.summary ? (
                    <p className="experience-flight__summary">{entry.summary}</p>
                  ) : null}
                  <div className="experience-flight__evidence">
                    <div>
                      <h4>Flight notes</h4>
                      <ul className="experience-flight__highlights">
                        {entry.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Working set</h4>
                      <ul
                        className="experience-flight__technologies"
                        aria-label={`${entry.organization} technologies`}
                      >
                        {entry.technologies.map((technology) => (
                          <li key={technology}>{technology}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </li>
            ))}

            {education.map((entry, educationIndex) => {
              const index = experience.length + educationIndex
              const item = timeline.items[index]
              return (
                <li className="experience-flight__chapter-wrap" key={item.id}>
                  <article
                    className="experience-flight__chapter experience-flight__chapter--education"
                    data-active={activeIndex === index ? '' : undefined}
                    data-experience-chapter
                    id={chapterId(item.id)}
                    aria-labelledby={`experience-heading-${item.id}`}
                  >
                    <header className="experience-flight__chapter-heading">
                      <img src={entry.logo} alt="" width="64" height="64" />
                      <p aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
                      <div>
                        <p>Education</p>
                        <h3 id={`experience-heading-${item.id}`}>
                          {entry.institution}
                        </h3>
                      </div>
                      <p>
                        <span>{entry.graduation}</span>
                        <span>{entry.location}</span>
                      </p>
                    </header>
                    <p className="experience-flight__summary">{entry.degree}</p>
                    <div className="experience-flight__evidence">
                      <div>
                        <h4>Coursework</h4>
                        <ul
                          className="experience-flight__coursework"
                          aria-label={`${entry.institution} coursework`}
                        >
                          {entry.coursework.map((course) => (
                            <li key={course}>{course}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="experience-flight__gpa">GPA {entry.gpa}</p>
                        <h4>Focus areas</h4>
                        <ul
                          className="experience-flight__technologies"
                          aria-label={`${entry.institution} focus areas`}
                        >
                          {entry.focusAreas.map((focus) => (
                            <li key={focus}>{focus}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ol>
        </div>

        <p className="experience-flight__prompt" aria-hidden="true">
          Scroll to follow the path <span>→</span>
        </p>
      </div>
    </div>
  )
}

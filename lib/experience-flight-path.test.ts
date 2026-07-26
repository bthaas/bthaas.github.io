import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import {
  buildExperienceTimeline,
  getExperienceChapterProgress,
  getExperienceChapterScrollY,
} from './experience-flight-path'

describe('experience flight-path chronology', () => {
  it('derives one honest date axis from the existing content', () => {
    const timeline = buildExperienceTimeline(
      siteContent.experience,
      siteContent.education,
    )

    expect(timeline.startLabel).toBe('Jun 2025')
    expect(timeline.endLabel).toBe('May 2026')
    expect(timeline.markers.map((marker) => marker.label)).toEqual([
      'Jun ’25',
      'Aug ’25',
      'Nov ’25',
      'Dec ’25',
      'May ’26',
    ])
    expect(timeline.items.map((item) => item.id)).toEqual([
      'uva-ml-research',
      'scale-ai',
      'refraction-innovation-hub',
      'education-university-of-virginia',
    ])
  })

  it('places overlapping roles and the graduation milestone proportionally', () => {
    const timeline = buildExperienceTimeline(
      siteContent.experience,
      siteContent.education,
    )
    const [uva, scale, refraction, education] = timeline.items

    expect(uva.start).toBeCloseTo(5 / 11)
    expect(uva.end).toBe(1)
    expect(scale.start).toBe(0)
    expect(scale.end).toBeCloseTo(6 / 11)
    expect(refraction.start).toBe(0)
    expect(refraction.end).toBeCloseTo(2 / 11)
    expect(education.start).toBe(1)
    expect(education.end).toBe(1)
  })

  it('maps every chapter link to normal document scroll inside the pin', () => {
    expect([0, 1, 2, 3].map((index) => getExperienceChapterProgress(index, 4)))
      .toEqual([0, 1 / 3, 2 / 3, 1])

    const metrics = {
      count: 4,
      headerOffset: 58,
      pinDistance: 2400,
      pinStart: 1800,
    }
    expect(getExperienceChapterScrollY({ ...metrics, index: 0 })).toBe(1742)
    expect(getExperienceChapterScrollY({ ...metrics, index: 2 })).toBe(3342)
    expect(getExperienceChapterScrollY({ ...metrics, index: 3 })).toBe(4142)
  })
})

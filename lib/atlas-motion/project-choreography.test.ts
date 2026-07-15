import { describe, expect, it } from 'vitest'

import {
  getProjectDirection,
  getProjectPan,
  getProjectViewProgress,
} from './project-choreography'

describe('project chapter choreography', () => {
  it('alternates the three chapter directions by project index', () => {
    expect([0, 1, 2].map(getProjectDirection)).toEqual(['ltr', 'rtl', 'ltr'])
    expect([3, 4].map(getProjectDirection)).toEqual(['rtl', 'ltr'])
  })

  it('pans a 115% plate within its overflow bounds and reverses chapter two', () => {
    expect(getProjectPan(0, 0)).toBe(-6.522)
    expect(getProjectPan(0.5, 0)).toBe(0)
    expect(getProjectPan(1, 0)).toBe(6.522)
    expect(getProjectPan(0, 1)).toBe(6.522)
    expect(getProjectPan(1, 1)).toBe(-6.522)
    expect(getProjectPan(-1, 2)).toBe(-6.522)
    expect(getProjectPan(2, 2)).toBe(6.522)
  })

  it('maps plate entry through exit to bounded view progress', () => {
    const metrics = {
      elementHeight: 600,
      elementTop: 2000,
      viewportHeight: 1000,
    }

    expect(getProjectViewProgress({ ...metrics, scrollY: 900 })).toBe(0)
    expect(getProjectViewProgress({ ...metrics, scrollY: 1800 })).toBe(0.5)
    expect(getProjectViewProgress({ ...metrics, scrollY: 2700 })).toBe(1)
  })

  it('resolves degenerate view ranges to a stable endpoint', () => {
    const metrics = {
      elementHeight: -1000,
      elementTop: 2000,
      viewportHeight: 1000,
    }

    expect(getProjectViewProgress({ ...metrics, scrollY: 999 })).toBe(0)
    expect(getProjectViewProgress({ ...metrics, scrollY: 1000 })).toBe(1)
  })
})

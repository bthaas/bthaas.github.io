import { describe, expect, it } from 'vitest'

import {
  getChapterDissolveFrame,
  getFlightLogTilt,
  getProjectAnchorScrollY,
  getProjectFlightFrame,
  getProjectPanelProgress,
  getProjectTrackTravel,
} from './project-flight-path'

describe('project flight path choreography', () => {
  it('uses only measured horizontal overflow as pin travel', () => {
    expect(getProjectTrackTravel(3200, 1440)).toBe(1760)
    expect(getProjectTrackTravel(900, 1024)).toBe(0)
    expect(getProjectTrackTravel(-10, 1024)).toBe(0)
  })

  it('maps every panel to a reversible normalized track stop', () => {
    expect([0, 1, 2].map((index) => getProjectPanelProgress(index, 3))).toEqual([
      0,
      0.5,
      1,
    ])
    expect(getProjectPanelProgress(-1, 3)).toBe(0)
    expect(getProjectPanelProgress(9, 3)).toBe(1)
    expect(getProjectPanelProgress(0, 1)).toBe(0)
  })

  it('turns a project fragment or focus target into normal document scroll', () => {
    const input = { count: 3, headerOffset: 58, pinDistance: 1800, pinStart: 2400 }
    expect(getProjectAnchorScrollY({ ...input, index: 0 })).toBe(2342)
    expect(getProjectAnchorScrollY({ ...input, index: 1 })).toBe(3242)
    expect(getProjectAnchorScrollY({ ...input, index: 2 })).toBe(4142)
  })

  it('bounds velocity bend and skew so the printed plates remain readable', () => {
    expect(getProjectFlightFrame(0)).toEqual({ bend: 0, skewDegrees: 0, uvShift: 0 })
    expect(getProjectFlightFrame(80)).toEqual({
      bend: 0.004,
      skewDegrees: 2.5,
      uvShift: 0.004,
    })
    expect(getProjectFlightFrame(1000)).toEqual({
      bend: 0.008,
      skewDegrees: 5,
      uvShift: 0.008,
    })
    expect(getProjectFlightFrame(-1000)).toEqual({
      bend: 0.008,
      skewDegrees: -5,
      uvShift: -0.008,
    })
    const reusable = { bend: 0, skewDegrees: 0, uvShift: 0 }
    expect(getProjectFlightFrame(80, reusable)).toBe(reusable)
    expect(reusable).toEqual({ bend: 0.004, skewDegrees: 2.5, uvShift: 0.004 })
  })
})

describe('print dissolve and dossier tilt choreography', () => {
  it('grows a reversible dot screen without a rectangular wipe edge', () => {
    expect(getChapterDissolveFrame(0, 1)).toEqual({ dotRadius: 0, offsetX: 12 })
    expect(getChapterDissolveFrame(0.5, -1)).toEqual({ dotRadius: 4.5, offsetX: -6 })
    expect(getChapterDissolveFrame(1, 1)).toEqual({ dotRadius: 9, offsetX: 0 })
    expect(getChapterDissolveFrame(4, 1)).toEqual({ dotRadius: 9, offsetX: 0 })
  })

  it('caps the held-dossier response at six degrees on either axis', () => {
    expect(getFlightLogTilt({ x: 0, y: 0 })).toEqual({ rotateX: -0, rotateY: 0 })
    expect(getFlightLogTilt({ x: 0.5, y: -0.5 })).toEqual({
      rotateX: 3,
      rotateY: 3,
    })
    expect(getFlightLogTilt({ x: 4, y: -4 })).toEqual({
      rotateX: 6,
      rotateY: 6,
    })
  })
})

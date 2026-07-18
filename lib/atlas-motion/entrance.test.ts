import { describe, expect, it } from 'vitest'

import {
  PRELOADER_DURATION_SECONDS,
  getFluidCursorEligibility,
  getPreloaderFrame,
  shouldRunPreloader,
} from './entrance'

describe('maximalist entrance choreography', () => {
  it('keeps the complete curtain entrance below the 1.8 second ceiling', () => {
    expect(PRELOADER_DURATION_SECONDS).toBeLessThanOrEqual(0.9)
    expect(PRELOADER_DURATION_SECONDS).toBeGreaterThanOrEqual(0.75)
  })

  it('snaps the counter while overlapping glyph draw and two curtain stages', () => {
    expect(getPreloaderFrame(0)).toEqual({
      counter: 0,
      curtain: 0,
      glyph: 0,
      lift: 0,
    })
    expect(getPreloaderFrame(0.37).counter % 5).toBe(0)
    expect(getPreloaderFrame(0.37).glyph).toBeGreaterThan(0)
    expect(getPreloaderFrame(0.68)).toMatchObject({ counter: 100, glyph: 1 })
    expect(getPreloaderFrame(0.78).curtain).toBeGreaterThan(0)
    expect(getPreloaderFrame(0.78).lift).toBe(0)
    expect(getPreloaderFrame(0.92).lift).toBeGreaterThan(0)
    expect(getPreloaderFrame(1)).toEqual({
      counter: 100,
      curtain: 1,
      glyph: 1,
      lift: 1,
    })
  })

  it('clamps progress so interrupted browser timing cannot overshoot', () => {
    expect(getPreloaderFrame(-1)).toEqual(getPreloaderFrame(0))
    expect(getPreloaderFrame(2)).toEqual(getPreloaderFrame(1))
  })

  it('runs the preloader once per session and never under reduced motion', () => {
    expect(shouldRunPreloader({ reducedMotion: false, seen: false })).toBe(true)
    expect(shouldRunPreloader({ reducedMotion: false, seen: true })).toBe(false)
    expect(shouldRunPreloader({ reducedMotion: true, seen: false })).toBe(false)
  })

  it('admits the fluid simulation only for capable fine-pointer desktops', () => {
    expect(getFluidCursorEligibility({
      finePointer: true,
      hover: true,
      reducedMotion: false,
      webgl: true,
    })).toBe(true)
    expect(getFluidCursorEligibility({
      finePointer: false,
      hover: true,
      reducedMotion: false,
      webgl: true,
    })).toBe(false)
    expect(getFluidCursorEligibility({
      finePointer: true,
      hover: true,
      reducedMotion: true,
      webgl: true,
    })).toBe(false)
    expect(getFluidCursorEligibility({
      finePointer: true,
      hover: true,
      reducedMotion: false,
      webgl: false,
    })).toBe(false)
  })
})

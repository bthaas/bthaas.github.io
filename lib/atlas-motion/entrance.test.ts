import { describe, expect, it } from 'vitest'

import { getFluidCursorEligibility } from './entrance'

describe('maximalist entrance choreography', () => {
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

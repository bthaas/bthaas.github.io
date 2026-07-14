import { describe, expect, it } from 'vitest'

import { getHeroChoreography } from './hero-choreography'

describe('getHeroChoreography', () => {
  it('starts with an intact composition and the distant camera', () => {
    const state = getHeroChoreography(0)

    expect(state.cameraZ).toBe(12.2)
    expect(state.backgroundLift).toBe(0)
    expect(Object.values(state.clusterDetachments).every((value) => value === 0)).toBe(true)
  })

  it('detaches the broken tip before the broken middle and intact tip', () => {
    const state = getHeroChoreography(0.3)

    expect(state.clusterDetachments.wingR_tip).toBeGreaterThan(
      state.clusterDetachments.wingR_mid,
    )
    expect(state.clusterDetachments.wingR_mid).toBeGreaterThan(
      state.clusterDetachments.wingL_tip,
    )
  })

  it('pushes the camera forward and brightens the atmosphere through the sequence', () => {
    const middle = getHeroChoreography(0.5)
    const end = getHeroChoreography(1)

    expect(middle.cameraZ).toBeLessThan(12.2)
    expect(end.cameraZ).toBeLessThan(middle.cameraZ)
    expect(end.backgroundLift).toBeGreaterThan(middle.backgroundLift)
    expect(end.clusterDetachments.wingL_root).toBeGreaterThan(0)
  })

  it('clamps progress outside the scroll range', () => {
    expect(getHeroChoreography(-1)).toEqual(getHeroChoreography(0))
    expect(getHeroChoreography(2)).toEqual(getHeroChoreography(1))
  })
})

import { afterEach, describe, expect, it } from 'vitest'

import {
  createScatteredLayout,
  createSkillRigidBodyWorld,
  type SkillRigidBodyWorld,
  type SkillTokenSize,
} from './skill-workbench-rigidbody'

const TOKEN_COUNT = 28
const ARENA_WIDTH = 1_280
const ARENA_HEIGHT = 520
const TOKEN_SIZES: readonly SkillTokenSize[] = Array.from(
  { length: TOKEN_COUNT },
  (_, index) => ({
    height: [42, 44, 46, 48][index % 4],
    width: [114, 128, 142, 155][index % 4],
  }),
)

function overlapArea(
  first: { x: number; y: number },
  firstSize: SkillTokenSize,
  second: { x: number; y: number },
  secondSize: SkillTokenSize,
) {
  const overlapX = (
    (firstSize.width + secondSize.width) / 2
    - Math.abs(second.x - first.x)
  )
  const overlapY = (
    (firstSize.height + secondSize.height) / 2
    - Math.abs(second.y - first.y)
  )

  return Math.max(0, overlapX) * Math.max(0, overlapY)
}

describe('skill workbench rigid-body layout', () => {
  let world: SkillRigidBodyWorld | null = null

  afterEach(() => {
    world?.destroy()
    world = null
  })

  it('builds a deterministic, non-overlapping scattered launch field', () => {
    const first = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 4_821_337,
      tokenSizes: TOKEN_SIZES,
    })
    const second = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 4_821_337,
      tokenSizes: TOKEN_SIZES,
    })

    expect(second).toEqual(first)
    expect(first).toHaveLength(TOKEN_COUNT)
    expect(new Set(first.map(({ x }) => Math.round(x / 20))).size).toBeGreaterThan(14)
    expect(new Set(first.map(({ y }) => Math.round(y / 20))).size).toBeGreaterThan(8)

    first.forEach((placement, index) => {
      const size = TOKEN_SIZES[index]
      expect(placement.x).toBeGreaterThanOrEqual(size.width / 2)
      expect(placement.x).toBeLessThanOrEqual(ARENA_WIDTH - size.width / 2)
      expect(placement.y).toBeGreaterThanOrEqual(size.height / 2)
      expect(placement.y).toBeLessThan(ARENA_HEIGHT * 0.76)

      for (let otherIndex = index + 1; otherIndex < first.length; otherIndex += 1) {
        expect(overlapArea(
          placement,
          size,
          first[otherIndex],
          TOKEN_SIZES[otherIndex],
        )).toBe(0)
      }
    })
  })

  it('changes the launch field when a new page-load seed is used', () => {
    const first = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 101,
      tokenSizes: TOKEN_SIZES,
    })
    const second = createScatteredLayout({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 202,
      tokenSizes: TOKEN_SIZES,
    })

    expect(second).not.toEqual(first)
  })

  it.each([1, 7, 31, 101, 509, 4_294_967_295])(
    'always returns a complete launch field for seed %s',
    (seed) => {
      const placements = createScatteredLayout({
        arenaHeight: ARENA_HEIGHT,
        arenaWidth: ARENA_WIDTH,
        seed,
        tokenSizes: TOKEN_SIZES,
      })

      expect(placements).toHaveLength(TOKEN_COUNT)
      placements.forEach((placement, index) => {
        for (
          let otherIndex = index + 1;
          otherIndex < placements.length;
          otherIndex += 1
        ) {
          expect(overlapArea(
            placement,
            TOKEN_SIZES[index],
            placements[otherIndex],
            TOKEN_SIZES[otherIndex],
          )).toBe(0)
        }
      })
    },
  )

  it('gives released tokens angular momentum and restores their scattered homes', () => {
    world = createSkillRigidBodyWorld({
      arenaHeight: ARENA_HEIGHT,
      arenaWidth: ARENA_WIDTH,
      seed: 73_119,
      tokenSizes: TOKEN_SIZES,
    })
    const homes = world.getHomes()

    expect(world.getSnapshots().every(({ isStatic }) => isStatic)).toBe(true)

    world.drop()
    for (let frame = 0; frame < 240; frame += 1) world.step(1_000 / 60)

    const fallen = world.getSnapshots()
    const rotatedBodies = fallen.filter((snapshot, index) => (
      Math.abs(snapshot.angle - homes[index].angle) > 0.08
    ))

    expect(fallen.every(({ isStatic }) => !isStatic)).toBe(true)
    expect(rotatedBodies.length).toBeGreaterThan(TOKEN_COUNT / 2)
    expect(Math.max(...fallen.map(({ angle }, index) => (
      Math.abs(angle - homes[index].angle)
    )))).toBeGreaterThan(0.25)

    world.stick()
    expect(world.getSnapshots()).toEqual(homes.map((home) => ({
      ...home,
      isSleeping: false,
      isStatic: true,
    })))
  })
})

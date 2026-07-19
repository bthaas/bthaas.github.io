import { describe, expect, it } from 'vitest'

import { getSkillLogos } from '@/components/portfolio/SkillLogos'
import { siteContent } from '@/content/site-content'

import {
  CONSTELLATION_ORDER,
  getShootingStarDelayMs,
  WING_EDGES,
  WING_STAR_ORDER,
  WING_STARS,
  WING_VIEWBOX,
  type ConstellationKey,
  type WingStarKey,
} from './wing-of-stars'

describe('Wing of Stars geometry', () => {
  const catalogSkills = getSkillLogos(siteContent.skills).map(({ label }) => label)

  it('assigns every catalog skill to exactly one ordered star', () => {
    expect(WING_STAR_ORDER).toHaveLength(new Set(WING_STAR_ORDER).size)
    expect([...WING_STAR_ORDER].sort()).toEqual([...catalogSkills].sort())
    expect(Object.keys(WING_STARS).sort()).toEqual([...catalogSkills].sort())
  })

  it('keeps every star inside the fixed viewBox at a unique position', () => {
    const positions = new Set<string>()

    for (const star of Object.values(WING_STARS)) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(WING_VIEWBOX.width)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThanOrEqual(WING_VIEWBOX.height)
      expect([1, 2, 3]).toContain(star.size)
      positions.add(`${star.x}:${star.y}`)
    }

    expect(positions.size).toBe(catalogSkills.length)
  })

  it('only connects existing stars inside their declared constellation', () => {
    for (const edge of WING_EDGES) {
      expect(WING_STARS[edge.from]).toBeDefined()
      expect(WING_STARS[edge.to]).toBeDefined()
      expect(WING_STARS[edge.from].constellation).toBe(edge.constellation)
      expect(WING_STARS[edge.to].constellation).toBe(edge.constellation)
    }
  })

  it.each(CONSTELLATION_ORDER)('%s is a connected graph', (constellation) => {
    const members = WING_STAR_ORDER.filter(
      (key) => WING_STARS[key].constellation === constellation,
    )
    const adjacency = new Map<WingStarKey, Set<WingStarKey>>(
      members.map((key) => [key, new Set<WingStarKey>()]),
    )

    WING_EDGES.filter((edge) => edge.constellation === constellation).forEach((edge) => {
      adjacency.get(edge.from)?.add(edge.to)
      adjacency.get(edge.to)?.add(edge.from)
    })

    const visited = new Set<WingStarKey>()
    const queue = members.slice(0, 1)
    while (queue.length > 0) {
      const current = queue.shift()
      if (!current || visited.has(current)) continue
      visited.add(current)
      adjacency.get(current)?.forEach((neighbor) => queue.push(neighbor))
    }

    expect(visited.size).toBe(members.length)
  })

  it('uses every named constellation and bounds shooting-star delays to 8–14 seconds', () => {
    const used = new Set<ConstellationKey>(
      Object.values(WING_STARS).map(({ constellation }) => constellation),
    )

    expect(used).toEqual(new Set(CONSTELLATION_ORDER))
    expect(getShootingStarDelayMs(-1)).toBe(8_000)
    expect(getShootingStarDelayMs(0.5)).toBe(11_000)
    expect(getShootingStarDelayMs(2)).toBe(14_000)
  })
})

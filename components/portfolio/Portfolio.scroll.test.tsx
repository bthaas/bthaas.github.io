import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { atlasVisuals } from '@/content/editorial-visuals'

import { Portfolio } from './Portfolio'

describe('Portfolio responsive media contract', () => {
  it('eagerly loads only the hero and exposes an AVIF/WebP picture pair', () => {
    const { container } = render(<Portfolio />)
    const hero = screen.getByRole('img', { name: 'Icarus flying over a geometric Aegean city' })
    const picture = hero.closest('picture')

    expect(hero).toHaveAttribute('src', atlasVisuals.hero.fallback)
    expect(hero).toHaveAttribute('fetchpriority', 'high')
    expect(hero).not.toHaveAttribute('loading', 'lazy')
    expect(picture?.querySelector('source[type="image/avif"]')).toHaveAttribute(
      'srcset',
      expect.stringContaining(atlasVisuals.hero.src),
    )
  })

  it('lazy loads every offscreen editorial artwork', () => {
    render(<Portfolio />)

    const offscreen = [
      screen.getByRole('img', { name: 'A cliffside workshop with sculptural wings' }),
      screen.getByRole('img', { name: 'A rising coastal city and lighthouse at dusk' }),
      screen.getByRole('img', { name: 'A geometric arena with analytical trajectory arcs' }),
      screen.getByRole('img', { name: 'Coastal architecture crossed by rhythmic signal ribbons' }),
      screen.getByRole('img', { name: 'A labyrinth observatory with two controlled light paths' }),
      screen.getByRole('img', { name: 'Distant wings crossing a calm sunrise horizon' }),
    ]

    for (const image of offscreen) expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('maps every project visual key to a delivered responsive asset', () => {
    expect(Object.keys(atlasVisuals.projects)).toEqual([
      'courtvision',
      'beatstream',
      'vision-bias-steering',
    ])

    for (const visual of Object.values(atlasVisuals.projects)) {
      expect(visual.src).toMatch(/^\/icarus-atlas\/.+-1200\.avif$/)
      expect(visual.fallback).toMatch(/^\/icarus-atlas\/.+-1200\.webp$/)
    }
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { atlasVisuals } from '@/content/editorial-visuals'

import { Portfolio } from './Portfolio'

describe('Portfolio responsive media contract', () => {
  it('removes the superseded hero artwork from the portfolio journey', () => {
    const { container } = render(<Portfolio />)

    expect(atlasVisuals).not.toHaveProperty('hero')
    expect(container.querySelector('.hero-section')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'A geometric Aegean city aligned with a rising sun' }),
    ).not.toBeInTheDocument()
  })

  it('lazy loads every offscreen editorial artwork', () => {
    render(<Portfolio />)

    const offscreen = [
      screen.getByRole('img', { name: 'A rising coastal city and lighthouse at dusk' }),
      screen.getByRole('img', { name: 'A geometric arena with analytical trajectory arcs' }),
      screen.getByRole('img', { name: 'Coastal architecture crossed by rhythmic signal ribbons' }),
      screen.getByRole('img', { name: 'A labyrinth observatory with two controlled light paths' }),
      screen.getByRole('img', {
        name: 'A calm sunrise horizon between distant mountain ridges',
      }),
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

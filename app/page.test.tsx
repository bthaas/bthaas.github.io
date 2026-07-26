import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomePage from './page'

describe('homepage', () => {
  it('contains only the full-screen rotating portfolio gateway', () => {
    const { container } = render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Brett Haas' })).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Portfolio category carousel' }),
    ).toBeInTheDocument()
    expect(container.querySelector('main')).toHaveAttribute('data-portfolio-screen', 'home')
    expect(
      Array.from(container.querySelectorAll('main > section')).map((section) => section.id),
    ).toEqual(['portfolio-gateway'])
    expect(container.querySelector('.hero-section')).not.toBeInTheDocument()
  })
})

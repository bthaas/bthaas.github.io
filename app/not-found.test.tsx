import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NotFound from './not-found'

describe('not found page', () => {
  it('renders a themed atlas recovery page with decorative glitch and feather layers', () => {
    const { container } = render(<NotFound />)

    expect(screen.getByRole('heading', {
      name: 'This plate is missing from the atlas.',
    })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to the atlas' })).toHaveAttribute('href', '/')
    expect(container.querySelector('img[src="/assets/wing-mark.png"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelector('[data-letter-glitch]')).toHaveAttribute('aria-hidden', 'true')
  })
})

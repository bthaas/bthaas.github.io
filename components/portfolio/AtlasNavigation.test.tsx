import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AtlasNavigation } from './AtlasNavigation'

const routes = [
  ['Home', '/'],
  ['Experience', '/experience'],
  ['Projects', '/projects'],
  ['Skills', '/skills'],
  ['Contact', '/contact'],
] as const

describe('AtlasNavigation', () => {
  it('keeps all five routes directly reachable with concise accessible names', () => {
    render(<AtlasNavigation current="projects" />)

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const links = within(navigation).getAllByRole('link')

    expect(links).toHaveLength(routes.length)
    routes.forEach(([name, href]) => {
      const link = within(navigation).getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('data-transition-kind', 'standard')
    })
    expect(within(navigation).queryByText('Brett Haas')).not.toBeInTheDocument()
  })

  it('exposes exactly one current route to assistive technology', () => {
    const { rerender } = render(<AtlasNavigation current="projects" />)

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current')))
      .toHaveLength(1)

    rerender(<AtlasNavigation current="home" />)

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getAllByRole('link').filter((link) => link.hasAttribute('aria-current')))
      .toHaveLength(1)
  })

  it('keeps the route index and wing mark decorative', () => {
    const { container } = render(<AtlasNavigation current="experience" />)

    expect(screen.getByRole('link', { name: 'Experience' })).toHaveTextContent(
      '01Experience',
    )
    expect(screen.queryByRole('link', { name: '01 Experience' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' }).querySelector('img')).toHaveAttribute(
      'alt',
      '',
    )
    expect(container.querySelectorAll('[aria-hidden="true"]')).not.toHaveLength(0)
  })
})

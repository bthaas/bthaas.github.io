import { act, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ATLAS_GATEWAY_SELECTION_EVENT } from '@/lib/atlas-events'

import { AtlasNavigation } from './AtlasNavigation'

const destinations = [
  ['Experience', '/experience'],
  ['Projects', '/projects'],
  ['Skills', '/skills'],
  ['Contact', '/contact'],
] as const

describe('AtlasNavigation', () => {
  it('keeps the four destinations on Home and follows the cylinder selection', () => {
    render(<AtlasNavigation current="home" />)

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const links = within(navigation).getAllByRole('link')

    expect(links).toHaveLength(destinations.length)
    expect(within(navigation).queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    destinations.forEach(([name, href]) => {
      const link = within(navigation).getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).not.toHaveAttribute('data-transition-kind')
    })
    expect(within(navigation).getByRole('link', { name: 'Experience' }))
      .toHaveAttribute('data-active-destination', 'true')
    expect(within(navigation).getAllByRole('link').some((link) => (
      link.hasAttribute('aria-current')
    ))).toBe(false)

    act(() => {
      window.dispatchEvent(new CustomEvent(ATLAS_GATEWAY_SELECTION_EVENT, {
        detail: { route: 'projects' },
      }))
    })

    expect(within(navigation).getByRole('link', { name: 'Projects' }))
      .toHaveAttribute('data-active-destination', 'true')
    expect(within(navigation).getByRole('link', { name: 'Experience' }))
      .not.toHaveAttribute('data-active-destination')

    act(() => {
      window.dispatchEvent(new CustomEvent(ATLAS_GATEWAY_SELECTION_EVENT, {
        detail: { route: 'unknown' },
      }))
    })

    expect(within(navigation).getByRole('link', { name: 'Projects' }))
      .toHaveAttribute('data-active-destination', 'true')
    expect(within(navigation).queryByText('Brett Haas')).not.toBeInTheDocument()
  })

  it('shows only a back-to-home control when the full index would crowd a screen', () => {
    const { container } = render(<AtlasNavigation current="projects" />)
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const home = within(navigation).getByRole('link', { name: 'Home' })

    expect(within(navigation).getAllByRole('link')).toEqual([home])
    expect(home).toHaveAttribute('href', '/')
    expect(home).not.toHaveAttribute('data-transition-kind')
    expect(home).toHaveTextContent('Home')
    expect(home).not.toHaveTextContent('←')
    expect(home.querySelector('svg')).toHaveAttribute('data-arrow-direction', 'left')
    expect(container.querySelector('.atlas-route-index')).not.toBeInTheDocument()
  })

  it.each([
    ['skills', 'Skills'],
    ['contact', 'Contact'],
  ] as const)(
    'keeps the complete route index on %s and marks its current page',
    (current, currentLabel) => {
      render(<AtlasNavigation current={current} />)
      const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })

      expect(within(navigation).getAllByRole('link')).toHaveLength(5)
      expect(within(navigation).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
      destinations.forEach(([name, href]) => {
        expect(within(navigation).getByRole('link', { name })).toHaveAttribute('href', href)
      })
      expect(within(navigation).getByRole('link', { name: currentLabel })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(within(navigation).getAllByRole('link').filter((link) => (
        link.hasAttribute('aria-current')
      )))
        .toHaveLength(1)
    },
  )

  it('keeps route numbers decorative without changing link names', () => {
    const { container } = render(<AtlasNavigation current="home" />)

    expect(screen.getByRole('link', { name: 'Experience' })).toHaveTextContent(
      '01Experience',
    )
    expect(screen.queryByRole('link', { name: '01 Experience' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"]')).not.toHaveLength(0)
  })
})

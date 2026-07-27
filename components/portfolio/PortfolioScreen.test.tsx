import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PortfolioScreen, type PortfolioScreenName } from './PortfolioScreen'

afterEach(cleanup)

describe('PortfolioScreen', () => {
  it.each([
    ['experience', 'Experience', 'experience'],
    ['projects', 'Projects', 'projects'],
    ['skills', 'Pick up the stack.', 'craft'],
    ['contact', 'Connect with me.', 'contact'],
  ] as const)('renders %s as one standalone screen', (screenName, heading, sectionId) => {
    const { container } = render(
      <PortfolioScreen screen={screenName as PortfolioScreenName} />,
    )

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    expect(container.querySelector('main')).toHaveAttribute(
      'data-portfolio-screen',
      screenName,
    )
    expect(container.querySelectorAll('main > section')).toHaveLength(1)
    expect(container.querySelector(`main > #${sectionId}`)).toBeInTheDocument()
  })

  it.each(['experience', 'projects', 'contact'] as const)(
    'keeps only a compact Home control on the %s screen',
    (screenName) => {
      render(<PortfolioScreen screen={screenName} />)
      const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
      const home = within(navigation).getByRole('link', { name: 'Home' })

      expect(within(navigation).getAllByRole('link')).toEqual([home])
      expect(home).toHaveAttribute('href', '/')
      expect(home).toHaveTextContent('Home')
      expect(home.querySelector('svg')).toHaveAttribute('data-arrow-direction', 'left')
      expect(within(navigation).queryByRole('link', { name: 'Experience' }))
        .not.toBeInTheDocument()
    },
  )

  it('keeps the full route index where it fits cleanly on Skills', () => {
    render(<PortfolioScreen screen="skills" />)
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })

    expect(within(navigation).getByRole('link', { name: 'Home' }))
      .toHaveAttribute('href', '/')
    expect(within(navigation).getByRole('link', { name: 'Experience' }))
      .toHaveAttribute('href', '/experience')
    expect(within(navigation).getByRole('link', { name: 'Projects' }))
      .toHaveAttribute('href', '/projects')
    expect(within(navigation).getByRole('link', { name: 'Skills' }))
      .toHaveAttribute('aria-current', 'page')
    expect(within(navigation).getByRole('link', { name: 'Skills' }))
      .toHaveAttribute('href', '/skills')
    expect(within(navigation).getByRole('link', { name: 'Contact' }))
      .toHaveAttribute('href', '/contact')
  })
})

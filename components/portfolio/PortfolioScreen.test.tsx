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

  it('keeps every screen reachable from the persistent navigation', () => {
    render(<PortfolioScreen screen="projects" />)
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })

    expect(within(navigation).getByRole('link', { name: 'Brett Haas' }))
      .toHaveAttribute('href', '/')
    expect(within(navigation).getByRole('link', { name: 'Experience' }))
      .toHaveAttribute('href', '/experience')
    expect(within(navigation).getByRole('link', { name: 'Projects' }))
      .toHaveAttribute('href', '/projects')
    expect(within(navigation).getByRole('link', { name: 'Skills' }))
      .toHaveAttribute('href', '/skills')
    expect(within(navigation).getByRole('link', { name: 'Contact' }))
      .toHaveAttribute('href', '/contact')
  })
})

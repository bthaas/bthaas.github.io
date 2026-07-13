import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Portfolio } from './Portfolio'

vi.mock('../scenes/HeroScene', () => ({
  HeroScene: () => <div data-testid="hero-scene" />,
}))

describe('Portfolio', () => {
  it('renders every editorial section from the real content source', () => {
    render(<Portfolio />)

    expect(screen.getByRole('heading', { name: 'Brett Haas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selected Work' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Constellation' })).toBeInTheDocument()
    expect(screen.getByText('I laughed as I fell, for I had soared.')).toBeInTheDocument()
    expect(screen.queryByText('Amazon')).not.toBeInTheDocument()
  })

  it('opens a project detail dialog and exposes its repository link', async () => {
    render(<Portfolio />)

    fireEvent.click(screen.getByRole('button', { name: 'Explore Court Vision' }))

    expect(await screen.findByRole('dialog', { name: 'Court Vision' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View repository' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas/CourtVision',
    )
  })

  it('provides working in-page navigation and contact links', () => {
    render(<Portfolio />)

    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#projects')
    expect(screen.getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'href',
      '#experience',
    )
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      'mailto:bthaas15@gmail.com',
    )
  })

  it('renders an inert cloud descent made from distinct puffy silhouettes', () => {
    const { container } = render(<Portfolio />)

    const cloudDescent = container.querySelector('[data-cloud-descent]')
    expect(cloudDescent).toHaveAttribute('aria-hidden', 'true')
    expect(cloudDescent).toHaveClass('cloud-descent')
    expect(cloudDescent?.querySelectorAll('.cloud-layer')).toHaveLength(3)
    expect(cloudDescent?.querySelectorAll('.cloud-puff')).toHaveLength(47)
    expect(cloudDescent?.querySelectorAll('.cloud-wipe-puff')).toHaveLength(35)
    cloudDescent?.querySelectorAll('.cloud-layer').forEach((layer) => {
      expect(layer.querySelectorAll('.cloud-puff')).toHaveLength(4)
    })
    expect(cloudDescent?.querySelector('.cloud-whiteout')).not.toBeInTheDocument()

    cloudDescent?.querySelectorAll('.cloud-puff').forEach((cloud) => {
      expect(cloud.querySelector('svg')).toBeInTheDocument()
      expect(cloud.querySelectorAll('circle').length).toBeGreaterThanOrEqual(4)
      expect(cloud.querySelector('.cloud-underside')).toBeInTheDocument()
    })
    expect(container.querySelector('#about [data-about-arrival]')).toBeInTheDocument()
  })
})

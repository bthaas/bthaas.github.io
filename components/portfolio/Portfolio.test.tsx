import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Portfolio } from './Portfolio'

vi.mock('../scenes/HeroExperience', () => ({
  HeroExperience: () => <div data-testid="hero-experience" />,
}))

vi.mock('../scenes/SectionSceneExperience', () => ({
  SectionSceneExperience: ({ variant }: { variant: string }) => (
    <div data-testid={`${variant}-experience`} />
  ),
}))

describe('Portfolio', () => {
  it('renders every editorial section from the real content source', () => {
    render(<Portfolio />)

    expect(screen.getByRole('heading', { name: 'Brett Haas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selected Work' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Constellation' })).toBeInTheDocument()
    expect(screen.getByText('Keep Building.')).toBeInTheDocument()
    expect(screen.getAllByTestId(/-experience$/)).toHaveLength(4)
    expect(screen.getAllByTestId('cloud-transition')).toHaveLength(3)
    expect(screen.queryByText('Amazon')).not.toBeInTheDocument()
  })

  it('opens accessible details from the ruins ring', async () => {
    render(<Portfolio />)

    const researchButton = screen.getByRole('button', { name: 'Explore AI Research' })
    fireEvent.focus(researchButton)
    fireEvent.blur(researchButton)
    fireEvent.mouseEnter(researchButton)
    fireEvent.mouseLeave(researchButton)
    fireEvent.click(researchButton)

    const dialog = await screen.findByRole('dialog', { name: 'AI Research' })
    expect(within(dialog).getByText(/inference-time activation steering/i)).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'AI Research' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Explore Scale AI' }))
    const scaleDialog = screen.getByRole('dialog', { name: 'Scale AI' })
    fireEvent.mouseDown(scaleDialog)
    expect(scaleDialog).toBeInTheDocument()
    fireEvent.mouseDown(scaleDialog.parentElement as HTMLElement)
    expect(screen.queryByRole('dialog', { name: 'Scale AI' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Explore Selected Work' }))
    expect(screen.queryByRole('link', { name: 'Continue to the full entry' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }))
  })

  it('opens a project detail dialog and exposes its repository link', async () => {
    render(<Portfolio />)

    const projectButton = screen.getByRole('button', { name: 'Explore Court Vision' })
    fireEvent.focus(projectButton)
    fireEvent.blur(projectButton)
    fireEvent.mouseEnter(projectButton)
    fireEvent.mouseLeave(projectButton)
    fireEvent.click(projectButton)

    expect(await screen.findByRole('dialog', { name: 'Court Vision' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View repository' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas/CourtVision',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Close project' }))
    expect(screen.queryByRole('dialog', { name: 'Court Vision' })).not.toBeInTheDocument()
  })

  it('exercises keyboard and pointer states for the skill constellation', () => {
    render(<Portfolio />)
    const python = screen.getByRole('button', { name: 'Python' })

    fireEvent.focus(python)
    expect(python).toHaveClass('active')
    fireEvent.blur(python)
    fireEvent.mouseEnter(python)
    expect(python).toHaveClass('active')
    fireEvent.mouseLeave(python)
    expect(python).not.toHaveClass('active')
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

  it('renders an inert reference-driven cloud descent with a real whiteout', () => {
    const { container } = render(<Portfolio />)

    const cloudDescent = container.querySelector('[data-cloud-descent]')
    expect(cloudDescent).toHaveAttribute('aria-hidden', 'true')
    expect(cloudDescent).toHaveClass('cloud-descent')
    expect(cloudDescent?.querySelectorAll('.cloud-reference-frame')).toHaveLength(3)
    expect(cloudDescent?.querySelector('.cloud-whiteout')).toBeInTheDocument()
    expect(cloudDescent?.querySelector('.cloud-puff')).not.toBeInTheDocument()
    expect(container.querySelector('#about [data-about-arrival]')).toBeInTheDocument()
  })

  it('keeps the narrative section order continuous', () => {
    const { container } = render(<Portfolio />)
    const ids = Array.from(container.querySelectorAll('main > section[id]')).map(
      (section) => section.id,
    )

    expect(ids).toEqual(['hero', 'about', 'experience', 'projects'])
  })
})

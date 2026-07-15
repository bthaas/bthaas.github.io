import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'
import { setupDossiers } from '@/src/atlas/experience'

import { Portfolio } from './Portfolio'

describe('Portfolio', () => {
  it('renders the complete editorial atlas as a semantic static journey', () => {
    const { container } = render(<Portfolio />)

    expect(screen.getByRole('heading', { level: 1, name: 'Brett Haas' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'I build intelligent systems that hold up in the real world.',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The craft behind the flight.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Trajectory' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Selected work' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Keep building.' })).toBeInTheDocument()

    const ids = Array.from(container.querySelectorAll('main > section[id]')).map(
      (section) => section.id,
    )
    expect(ids).toEqual(['hero', 'craft', 'experience', 'projects', 'contact'])
  })

  it('keeps navigation visible, concise, and anchored to the editorial sections', () => {
    render(<Portfolio />)

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).getByRole('link', { name: 'Brett Haas' })).toHaveAttribute(
      'href',
      '#hero',
    )
    expect(within(navigation).getByRole('link', { name: 'Craft' })).toHaveAttribute(
      'href',
      '#craft',
    )
    expect(within(navigation).getByRole('link', { name: 'Trajectory' })).toHaveAttribute(
      'href',
      '#experience',
    )
    expect(within(navigation).getByRole('link', { name: 'Work' })).toHaveAttribute(
      'href',
      '#projects',
    )
    expect(within(navigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '#contact',
    )
  })

  it('surfaces the four verified field metrics with their source labels', () => {
    render(<Portfolio />)

    const metrics = screen.getAllByTestId('featured-metric')
    expect(metrics).toHaveLength(4)
    expect(metrics.map((metric) => within(metric).getByTestId('metric-value').textContent)).toEqual([
      '616K+',
      '28.9%',
      '55%',
      '99.5%',
    ])
    expect(screen.getByText('COCO captions filtered')).toBeInTheDocument()
    expect(screen.getByText('RMS next-token bias reduction')).toBeInTheDocument()
    expect(screen.getByText('load-time improvement')).toBeInTheDocument()
    expect(screen.getByText('crash-free sessions')).toBeInTheDocument()
  })

  it('labels portfolio groups with valid native and ARIA semantics', () => {
    render(<Portfolio />)

    expect(screen.getByRole('group', { name: 'Portfolio introduction' })).toBeInTheDocument()

    const metrics = screen.getByRole('list', { name: 'Selected verified results' })
    expect(within(metrics).getAllByRole('listitem')).toHaveLength(4)

    expect(
      screen.getByRole('region', { name: 'Core capabilities ticker; focus to pause' }),
    ).toBeInTheDocument()

    const flightLog = screen.getByRole('list', { name: 'Professional experience' })
    expect(flightLog.tagName).toBe('OL')
    const flightEntries = Array.from(flightLog.children)
    expect(flightEntries).toHaveLength(4)
    flightEntries.forEach((entry) => {
      expect(entry.tagName).toBe('LI')
    })

    expect(
      screen.getByRole('timer', { name: 'Local time in Charlottesville, Virginia' }),
    ).toBeInTheDocument()
  })

  it('keeps Craft capabilities static while providing one hidden marquee duplicate', () => {
    const { container } = render(<Portfolio />)
    const capabilities = siteContent.craftCapabilities
    const notes = container.querySelector('.craft-notes')
    const marquee = container.querySelector<HTMLElement>('[data-craft-marquee]')
    const sequences = marquee?.querySelectorAll('.craft-marquee__sequence')

    expect(notes).not.toBeNull()
    expect(Array.from(notes?.querySelectorAll('p') ?? [], ({ textContent }) => textContent)).toEqual(
      capabilities,
    )
    expect(marquee).toHaveAttribute('tabindex', '0')
    expect(sequences).toHaveLength(2)
    expect(sequences?.[0]).not.toHaveAttribute('aria-hidden')
    expect(sequences?.[1]).toHaveAttribute('aria-hidden', 'true')
    expect(sequences?.[0].textContent).toBe(sequences?.[1].textContent)
  })

  it('server-renders every professional dossier from content and skips education', () => {
    const { container } = render(<Portfolio />)
    const entries = Array.from(container.querySelectorAll<HTMLElement>('.flight-entry'))

    expect(entries).toHaveLength(4)
    siteContent.experience.forEach((experience, index) => {
      const entry = entries[index]
      const toggle = within(entry).getByRole('button', { name: 'Field notes +' })
      const panelId = toggle.getAttribute('aria-controls')

      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(panelId).toBe(`flight-dossier-${experience.id}`)
      expect(entry.querySelector(`#${panelId}`)).not.toBeNull()
      experience.highlights.forEach((highlight) => {
        expect(within(entry).getByText(highlight)).toBeInTheDocument()
      })
      experience.technologies.forEach((technology) => {
        expect(within(entry).getByText(technology)).toBeInTheDocument()
      })
    })

    expect(within(entries[3]).queryByRole('button', { name: 'Field notes +' })).toBeNull()
  })

  it('collapses enhanced dossiers on init and toggles ARIA state without moving focus', () => {
    document.documentElement.classList.add('atlas-js')
    render(<Portfolio />)
    const cleanup = setupDossiers(document)
    const toggles = screen.getAllByRole('button', { name: 'Field notes +' })
    const firstToggle = toggles[0]
    const firstDossier = firstToggle.closest<HTMLElement>('[data-dossier]')

    expect(toggles).toHaveLength(3)
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    expect(firstDossier).toHaveAttribute('data-state', 'closed')

    firstToggle.focus()
    fireEvent.click(firstToggle)
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    expect(firstDossier).toHaveAttribute('data-state', 'open')
    expect(firstToggle).toHaveFocus()

    fireEvent.click(firstToggle)
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    expect(firstDossier).toHaveAttribute('data-state', 'closed')

    fireEvent.keyDown(firstToggle, { key: ' ' })
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    fireEvent.keyDown(firstToggle, { key: 'Enter' })
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(firstToggle, { key: 'Escape' })
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')

    cleanup()
    document.documentElement.classList.remove('atlas-js')
  })

  it('presents every project as an inline case study with a repository link', () => {
    render(<Portfolio />)

    const studies = screen.getAllByTestId('project-case-study')
    expect(studies).toHaveLength(3)
    expect(within(studies[0]).getByRole('heading', { name: 'Court Vision' })).toBeInTheDocument()
    expect(within(studies[1]).getByRole('heading', { name: 'Beat Stream' })).toBeInTheDocument()
    expect(
      within(studies[2]).getByRole('heading', { name: 'Vision Bias Steering' }),
    ).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'View Court Vision repository' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas/CourtVision',
    )
    expect(screen.getByRole('link', { name: 'View Beat Stream repository' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas/BeatStream',
    )
    expect(
      screen.getByRole('link', { name: 'View Vision Bias Steering repository' }),
    ).toHaveAttribute('href', 'https://github.com/bthaas/vision-bias-steering')
  })

  it('marks project chapters for alternating wipes, pans, cascades, and magnetic links', () => {
    render(<Portfolio />)

    const studies = screen.getAllByTestId('project-case-study')
    expect(studies.map((study) => study.getAttribute('data-wipe-direction'))).toEqual([
      'ltr',
      'rtl',
      'ltr',
    ])

    studies.forEach((study) => {
      expect(study).toHaveAttribute('data-chapter-wipe')
      expect(study.querySelector('[data-project-pan]')).not.toBeNull()
      expect(study.querySelector('.case-study-copy')).toHaveAttribute('data-reveal-stagger')
      expect(within(study).getByRole('link', { name: /repository/i })).toHaveAttribute(
        'data-magnetic',
      )
    })
  })

  it('contains no legacy cinematic or modal presentation surfaces', () => {
    const { container } = render(<Portfolio />)

    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(container.querySelector('[data-webgl]')).not.toBeInTheDocument()
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-testid="cloud-transition"]')).not.toBeInTheDocument()
    expect(container.querySelector('.descent-rail')).not.toBeInTheDocument()
    expect(container.querySelector('.project-track')).not.toBeInTheDocument()
  })

  it('keeps the contact destinations explicit and keyboard reachable', () => {
    const { container } = render(<Portfolio />)

    expect(screen.getByRole('link', { name: 'Email Brett' })).toHaveAttribute(
      'href',
      'mailto:bthaas15@gmail.com',
    )
    expect(screen.getByRole('link', { name: 'Email Brett' })).toHaveAttribute('data-magnetic')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas',
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/brett-haas',
    )
    expect(container.querySelector('[data-contact-title]')).toHaveTextContent('Keep building.')
    expect(container.querySelector('[data-contact-sunrise]')).toBeInTheDocument()
    expect(container.querySelector('[data-atlas-local-time]')).toHaveTextContent(
      'Charlottesville, VA',
    )
    expect(container.querySelector('[data-atlas-local-time]')).not.toHaveTextContent(/\d{2}:\d{2}/)
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'
import { spreadSkillSphereOrder } from '@/lib/atlas-motion/skill-sphere'
import { setupDossiers } from '@/src/atlas/experience'

import { Portfolio } from './Portfolio'
import { getSkillLogos } from './SkillLogos'

describe('Portfolio', () => {
  it('renders the complete editorial atlas as a semantic static journey', () => {
    const { container } = render(<Portfolio />)

    expect(screen.getByRole('heading', { level: 1, name: 'Brett Haas' })).toBeInTheDocument()
    expect(
      screen.queryByText('I build intelligent systems that hold up in the real world.'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(siteContent.identity.descriptor)).not.toBeInTheDocument()
    const heroActions = screen.getByRole('group', { name: 'Portfolio roles and projects' })
    expect(within(heroActions).getByText('Engineer · Researcher · Builder')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(within(heroActions).getByRole('link', { name: 'Explore projects' })).toHaveAttribute(
      'href',
      '#projects',
    )
    expect(screen.getByText('03 / Skills')).toBeInTheDocument()
    const craftGhost = container.querySelector<HTMLElement>('[data-craft-ghost]')
    expect(craftGhost).toHaveAttribute('data-craft-ghost', '03')
    expect(craftGhost).toBeEmptyDOMElement()
    expect(screen.getByRole('heading', { name: 'The skills behind the flight.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Connect with me.' })).toBeInTheDocument()
    expect(
      container.querySelector('.atlas-picture--hero source[type="image/avif"]'),
    ).toHaveAttribute(
      'srcset',
      expect.stringContaining('/icarus-atlas/hero-flight-640.avif 640w'),
    )
    expect(
      container.querySelector('.atlas-picture--hero source[type="image/avif"]'),
    ).toHaveAttribute(
      'srcset',
      expect.stringContaining('/icarus-atlas/hero-flight-768.avif 768w'),
    )
    expect(container.querySelector('.hero-art')).not.toHaveAttribute('data-atlas-velocity-plate')
    expect(container.querySelector('.sun-badge__orbit .circular-text')).not.toBeInTheDocument()
    expect(container.querySelector('[data-atlas-sun-trigger]')).toHaveAccessibleName(
      'Release the sun spectacle',
    )

    expect(container.querySelector('.kinetic-type-band')).not.toBeInTheDocument()

    const ids = Array.from(container.querySelectorAll('main > section[id]')).map(
      (section) => section.id,
    )
    expect(ids).toEqual(['hero', 'portfolio-gateway', 'experience', 'projects', 'craft', 'contact'])
    expect(container.querySelector('[data-chapter-wipe]')).not.toBeInTheDocument()
    expect(container.querySelector('[data-experience-light-step]')).not.toBeInTheDocument()
  })

  it('keeps navigation visible, concise, and anchored to the editorial sections', () => {
    render(<Portfolio />)

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const brandLink = within(navigation).getByRole('link', { name: 'Brett Haas' })
    expect(brandLink).toHaveAttribute('href', '#hero')
    expect(brandLink.querySelector('img')).toHaveAttribute('src', '/original-wing-filled.png')
    expect(brandLink.querySelector('img')).toHaveAttribute('alt', '')
    expect(within(navigation).getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'href',
      '#experience',
    )
    expect(within(navigation).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '#projects',
    )
    expect(within(navigation).getByRole('link', { name: 'Skills' })).toHaveAttribute(
      'href',
      '#craft',
    )
    expect(within(navigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '#contact',
    )
  })

  it('removes the standalone metrics strip from the hero', () => {
    const { container } = render(<Portfolio />)

    expect(container.querySelector('.signal-strip')).not.toBeInTheDocument()
    expect(screen.queryByTestId('featured-metric')).not.toBeInTheDocument()
  })

  it('labels portfolio groups with valid native and ARIA semantics', () => {
    render(<Portfolio />)

    expect(screen.getByRole('group', { name: 'Portfolio introduction' })).toBeInTheDocument()

    expect(
      screen.getByRole('region', { name: 'Technology logo ticker; focus to pause' }),
    ).toBeInTheDocument()

    const flightLog = screen.getByRole('list', { name: 'Professional experience' })
    expect(flightLog.tagName).toBe('OL')
    const flightEntries = Array.from(flightLog.children)
    expect(flightEntries).toHaveLength(4)
    flightEntries.forEach((entry) => {
      expect(entry.tagName).toBe('LI')
    })

    expect(
      screen.getByRole('timer', { name: 'Local time in Bellevue, Washington' }),
    ).toBeInTheDocument()
  })

  it('renders resume technologies as an accessible skill sphere with an unchanged marquee', () => {
    const { container } = render(<Portfolio />)
    const logos = getSkillLogos(siteContent.skills)
    const sphere = screen.getByRole('region', { name: 'Interactive skill sphere' })
    const skillList = within(sphere).getByRole('list', {
      name: 'Skills on the sphere',
    })
    const marquee = container.querySelector<HTMLElement>('[data-craft-marquee]')
    const sequences = marquee?.querySelectorAll('.craft-marquee__sequence')

    expect(within(skillList).getAllByRole('listitem')).toHaveLength(logos.length)
    expect(within(skillList).getAllByRole('button').map((item) => item.getAttribute('aria-label')))
      .toEqual(spreadSkillSphereOrder(logos.length).map((index) => logos[index].label))
    within(skillList).getAllByRole('button').forEach((item) => {
      expect(item).toHaveAttribute('type', 'button')
    })
    expect(logos.map(({ label }) => label)).toEqual(
      expect.arrayContaining([
        'TypeScript',
        'Python',
        'React',
        'Claude Code',
        'Amazon Web Services',
        'Docker',
        'PostgreSQL',
        'OpenAI API',
      ]),
    )
    expect(logos.map(({ label }) => label)).not.toContain('REST APIs')
    expect(marquee).toHaveAttribute('tabindex', '0')
    expect(sequences).toHaveLength(2)
    expect(sequences?.[0]).toHaveAttribute('aria-hidden', 'true')
    expect(sequences?.[1]).toHaveAttribute('aria-hidden', 'true')
    expect(sequences?.[0].querySelectorAll('svg')).toHaveLength(logos.length)
    expect(sequences?.[1].querySelectorAll('svg')).toHaveLength(logos.length)
    expect(container.querySelector('noscript')).toBeInTheDocument()
    expect(container.querySelector('.craft-notes .craft-logo-grid')).not.toBeInTheDocument()
    const board = container.querySelector('.craft-board')
    expect(board?.nextElementSibling).toBe(sphere)
    expect(sphere.compareDocumentPosition(marquee as Node) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy()
  })

  it('server-renders every professional dossier from content and skips education', () => {
    const { container } = render(<Portfolio />)
    const entries = Array.from(container.querySelectorAll<HTMLElement>('.flight-entry'))
    const flightIndices = Array.from(container.querySelectorAll<HTMLElement>('.flight-index'))

    expect(entries).toHaveLength(4)
    expect(flightIndices).toHaveLength(4)
    flightIndices.forEach((index) => expect(index).toHaveAttribute('aria-hidden', 'true'))
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

    const educationEntry = entries[3]
    expect(within(educationEntry).queryByRole('button', { name: 'Field notes +' })).toBeNull()
    expect(within(educationEntry).getByText('GPA: 3.7')).toBeVisible()
    expect(
      within(educationEntry).getByText(
        'Relevant coursework: Computer Systems, Data Structures and Algorithms, Software Engineering, Cybersecurity, Machine Learning, Reinforcement Learning',
      ),
    ).toBeVisible()
    expect(within(educationEntry).getByText('Charlottesville, VA')).toBeVisible()
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

    firstToggle.click()
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    firstToggle.click()
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(firstToggle, { key: 'Escape' })
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false')

    cleanup()
    document.documentElement.classList.remove('atlas-js')
  })

  it('keeps project details off the homepage and links every panel to its own page', () => {
    render(<Portfolio />)

    const panelTriggers = screen.getAllByTestId('project-panel-trigger')
    expect(panelTriggers).toHaveLength(3)
    expect(screen.queryAllByTestId('project-case-study')).toHaveLength(0)

    siteContent.projects.forEach((project, index) => {
      const trigger = panelTriggers[index]

      expect(trigger).toHaveAttribute('href', `/projects/${project.id}`)
      expect(trigger).not.toHaveAttribute('aria-controls')
      expect(trigger).not.toHaveAttribute('aria-expanded')
      expect(within(trigger).getByText(project.name)).toBeInTheDocument()
      expect(within(trigger).getByText(project.description)).toBeInTheDocument()
    })

    expect(screen.queryByText('View project results')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /repository/i })).not.toBeInTheDocument()
  })

  it('renders projects as the original three-card gallery with scroll-linked image pans', () => {
    render(<Portfolio />)

    const panelList = screen.getByRole('navigation', { name: 'Select a project' })
    const panels = screen.getAllByTestId('project-panel-trigger')

    expect(panelList).toHaveClass('atlas-shell', 'project-panel-list')
    expect(panelList).toHaveAttribute('data-reveal-stagger')
    expect(panelList).not.toHaveAttribute('data-project-flight-track')
    panels.forEach((panel, index) => {
      expect(panel).toHaveAttribute('id', `project-${siteContent.projects[index].id}`)
      expect(panel).toHaveAttribute('data-atlas-velocity-plate')
      expect(panel.querySelector('[data-project-pan]')).toHaveAttribute(
        'data-project-pan-index',
        String(index),
      )
    })
    expect(document.querySelector('[data-project-flight-stage]')).not.toBeInTheDocument()
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

    const contactLinks = screen.getByRole('navigation', { name: 'Contact links' })
    const email = within(contactLinks).getByRole('link', { name: 'Email Brett' })
    const github = within(contactLinks).getByRole('link', { name: 'GitHub' })
    const linkedin = within(contactLinks).getByRole('link', { name: 'LinkedIn' })

    expect(email).toHaveAttribute(
      'href',
      'mailto:bthaas15@gmail.com',
    )
    expect(email).toHaveAttribute('data-magnetic')
    expect(github).toHaveAttribute(
      'href',
      'https://github.com/bthaas',
    )
    expect(linkedin).toHaveAttribute(
      'href',
      'https://linkedin.com/in/brett-haas',
    )
    expect(github).toHaveAttribute('data-magnetic')
    expect(linkedin).toHaveAttribute('data-magnetic')
    expect(contactLinks.querySelectorAll('.contact-link svg')).toHaveLength(3)
    expect(
      Array.from(contactLinks.querySelectorAll('.contact-link svg')).every(
        (icon) => icon.getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true)
    expect(screen.getByText(/Always open to a conversation about interesting ideas/i)).toBeVisible()
    expect(container.querySelector('[data-contact-title]')).toHaveTextContent('Connect with me.')
    expect(container.querySelector('[data-contact-sunrise]')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-contact-detail]')).toHaveLength(6)
    expect(container.querySelector('[data-atlas-local-time]')).toHaveTextContent(
      'Bellevue, WA',
    )
    expect(container.querySelector('[data-atlas-local-time]')).not.toHaveTextContent(/\d{2}:\d{2}/)
  })

  it('frames the horizon artwork as an inset plate on the contact canvas', () => {
    const { container } = render(<Portfolio />)
    const contact = container.querySelector('#contact')
    const plate = contact?.querySelector('.contact-plate')

    expect(plate).toHaveClass('contact-plate--inset')
    expect(
      within(plate as HTMLElement).getByRole('img', {
        name: 'A calm sunrise horizon between distant mountain ridges',
      }),
    ).toBeInTheDocument()
  })

  it('pairs Experience and Skills artwork with dedicated editorial copy panels', () => {
    const { container } = render(<Portfolio />)
    const experienceBoard = container.querySelector<HTMLElement>('.experience-board')
    const craftBoard = container.querySelector<HTMLElement>('.craft-board')

    expect(experienceBoard?.children).toHaveLength(2)
    expect(experienceBoard?.firstElementChild).toHaveClass(
      'experience-plate',
      'experience-plate--inset',
    )
    expect(experienceBoard?.lastElementChild).toHaveClass('experience-panel')
    expect(
      within(experienceBoard as HTMLElement).getByRole('img', {
        name: 'A rising coastal city and lighthouse at dusk',
      }),
    ).toBeInTheDocument()
    expect(
      within(experienceBoard as HTMLElement).getByRole('heading', { name: 'Experience' }),
    ).toBeInTheDocument()

    expect(craftBoard?.children).toHaveLength(2)
    expect(craftBoard?.firstElementChild).toHaveClass('craft-plate', 'craft-plate--inset')
    expect(craftBoard?.lastElementChild).toHaveClass('craft-panel')
    expect(
      within(craftBoard as HTMLElement).getByRole('img', {
        name: 'A cliffside workshop with sculptural wings',
      }),
    ).toBeInTheDocument()
    expect(
      within(craftBoard as HTMLElement).getByRole('heading', {
        name: 'The skills behind the flight.',
      }),
    ).toBeInTheDocument()
  })
})

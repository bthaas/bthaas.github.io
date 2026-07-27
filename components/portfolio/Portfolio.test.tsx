import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import { Portfolio } from './Portfolio'
import { getSkillLogos } from './SkillLogos'

describe('Portfolio', () => {
  it('renders the complete editorial atlas as a semantic static journey', () => {
    const { container } = render(<Portfolio />)

    expect(screen.getByRole('heading', { level: 1, name: 'Brett Haas' })).toBeInTheDocument()
    expect(
      screen.queryByText('I build intelligent systems that hold up in the real world.'),
    ).not.toBeInTheDocument()
    const introduction = screen.getByRole('group', { name: 'Portfolio introduction' })
    expect(within(introduction).getByText('Portfolio / 2026')).toBeInTheDocument()
    expect(within(introduction).getByText(siteContent.identity.title)).toBeInTheDocument()
    expect(within(introduction).getByText(siteContent.identity.location)).toBeInTheDocument()
    expect(screen.getByText('Engineer · Researcher · Builder')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument()
    expect(screen.getByText('03 / Skills')).toBeInTheDocument()
    expect(container.querySelector('[data-craft-ghost]')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pick up the stack.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Connect with me.' })).toBeInTheDocument()
    expect(container.querySelector('.sun-badge')).not.toBeInTheDocument()

    expect(container.querySelector('.kinetic-type-band')).not.toBeInTheDocument()

    const ids = Array.from(container.querySelectorAll('main > section[id]')).map(
      (section) => section.id,
    )
    expect(ids).toEqual(['portfolio-gateway', 'experience', 'projects', 'craft', 'contact'])
    expect(container.querySelector('[data-experience-light-step]')).not.toBeInTheDocument()
  })

  it('keeps navigation visible, concise, and routed to the standalone screens', () => {
    render(<Portfolio />)

    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    expect(within(navigation).queryByRole('link', { name: 'Home' })).not.toBeInTheDocument()
    expect(within(navigation).getAllByRole('link')).toHaveLength(4)
    expect(within(navigation).queryByText('Brett Haas')).not.toBeInTheDocument()
    expect(within(navigation).getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'href',
      '/experience',
    )
    expect(within(navigation).getByRole('link', { name: 'Experience' }))
      .toHaveAttribute('data-active-destination', 'true')
    expect(within(navigation).getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(within(navigation).getByRole('link', { name: 'Skills' })).toHaveAttribute(
      'href',
      '/skills',
    )
    expect(within(navigation).getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'href',
      '/contact',
    )
  })

  it('labels portfolio groups with valid native and ARIA semantics', () => {
    render(<Portfolio />)

    expect(screen.getByRole('group', { name: 'Portfolio introduction' })).toBeInTheDocument()

    expect(screen.getByRole('region', { name: 'Interactive skill workbench' }))
      .toBeInTheDocument()

    const flightLog = screen.getByRole('list', {
      name: 'Professional experience and education',
    })
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

  it('renders resume technologies as one accessible categorized workbench', () => {
    const { container } = render(<Portfolio />)
    const logos = getSkillLogos(siteContent.skills)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const skillList = within(workbench).getByRole('list', {
      name: 'Movable technology tools',
    })

    expect(within(skillList).getAllByRole('listitem')).toHaveLength(logos.length)
    expect(within(skillList).getAllByRole('button').map((item) => item.getAttribute('aria-label')))
      .toEqual(logos.map(({ category, label }) => `${label}, ${category}`))
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
    expect(within(workbench).getByRole('group', {
      name: 'Filter skills by category',
    })).toBeInTheDocument()
    expect(container.querySelector('[data-craft-marquee]')).not.toBeInTheDocument()
    expect(container.querySelector('.skill-sphere')).not.toBeInTheDocument()
    expect(container.querySelector('noscript')).toBeInTheDocument()
    expect(container.querySelector('.craft-board')).not.toBeInTheDocument()
    expect(container.querySelector('#craft')?.firstElementChild).toBe(workbench)
  })

  it('server-renders every career stop from the unchanged content source', () => {
    const { container } = render(<Portfolio />)
    const entries = Array.from(
      container.querySelectorAll<HTMLElement>('[data-experience-chapter]'),
    )

    expect(entries).toHaveLength(4)
    siteContent.experience.forEach((experience, index) => {
      const entry = entries[index]

      experience.highlights.forEach((highlight) => {
        expect(within(entry).getByText(highlight)).not.toBeVisible()
      })
      experience.technologies.forEach((technology) => {
        expect(within(entry).getByText(technology)).not.toBeVisible()
      })
    })

    const educationEntry = entries[3]
    expect(within(educationEntry).getByText('GPA 3.7')).not.toBeVisible()
    expect(within(educationEntry).getByText('Computer Systems')).not.toBeVisible()
    expect(within(educationEntry).getByText('Reinforcement Learning')).not.toBeVisible()
    expect(within(educationEntry).getByText('Charlottesville, VA')).toBeVisible()
    expect(screen.getByRole('region', { name: 'Career timeline' }))
      .toBeInTheDocument()
    expect(container.querySelector('.flight-dossier')).not.toBeInTheDocument()
  })

  it('keeps project details off the homepage and links every panel to its own page', () => {
    render(<Portfolio />)

    const panelTriggers = screen.getAllByTestId('project-spiral-fallback-link')
    expect(panelTriggers).toHaveLength(3)
    expect(screen.queryAllByTestId('project-case-study')).toHaveLength(0)

    siteContent.projects.forEach((project, index) => {
      const trigger = panelTriggers[index]
      const projectItem = trigger.closest('li')

      expect(trigger).toHaveAttribute('href', `/projects/${project.id}`)
      expect(trigger).not.toHaveAttribute('aria-controls')
      expect(trigger).not.toHaveAttribute('aria-expanded')
      expect(projectItem).not.toBeNull()
      expect(within(projectItem as HTMLElement).getByText(project.name)).toBeInTheDocument()
      expect(within(projectItem as HTMLElement).getByText(project.description)).toBeInTheDocument()
    })

    expect(screen.queryByText('View project results')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /repository/i })).not.toBeInTheDocument()
  })

  it('server-renders the project spiral with its complete static fallback', () => {
    render(<Portfolio />)

    const panelList = screen.getByRole('list', { name: 'Projects' })
    const panels = screen.getAllByTestId('project-spiral-fallback-link')

    expect(panelList).toHaveClass('project-spiral__projects')
    expect(panelList).toHaveAttribute('data-project-spiral-fallback')
    panels.forEach((panel, index) => {
      const projectItem = panel.closest('li')
      expect(panel).toHaveAttribute('id', `project-${siteContent.projects[index].id}`)
      expect(projectItem).not.toBeNull()
      expect(within(projectItem as HTMLElement).getByText(siteContent.projects[index].name))
        .toBeInTheDocument()
    })
    expect(document.querySelector('[data-project-spiral-stage]')).toBeInTheDocument()
  })

  it('lets the project spiral own the page without explanatory intro copy', () => {
    const { container } = render(<Portfolio />)
    const projectsSection = container.querySelector('#projects')
    const projectScene = projectsSection?.querySelector('.project-spiral')

    expect(projectsSection?.firstElementChild).toBe(projectScene)
    expect(projectsSection?.querySelector('.projects-intro')).not.toBeInTheDocument()
    expect(within(projectScene as HTMLElement).getByRole('heading', {
      name: 'Projects',
    })).toBeInTheDocument()
    expect(within(projectScene as HTMLElement).getByText('02 / Field studies'))
      .toBeInTheDocument()
    expect(screen.queryByText(/Three builds across computer vision/i)).not.toBeInTheDocument()
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

  it('gives Experience an atmospheric timeline while Skills uses its workbench', () => {
    const { container } = render(<Portfolio />)
    const experienceFlight = container.querySelector<HTMLElement>('[data-experience-flight]')

    expect(experienceFlight?.querySelector('.experience-timeline__art img'))
      .toHaveAttribute('alt', '')
    expect(
      within(experienceFlight as HTMLElement).getByRole('heading', { name: 'Experience' }),
    ).toBeInTheDocument()
    expect(
      within(experienceFlight as HTMLElement).getByRole('region', {
        name: 'Career timeline',
      }),
    ).toBeInTheDocument()
    expect(container.querySelector('.craft-board')).not.toBeInTheDocument()
    expect(screen.queryByRole('img', {
      name: 'A cliffside workshop with sculptural wings',
    })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pick up the stack.' })).toBeInTheDocument()
  })
})

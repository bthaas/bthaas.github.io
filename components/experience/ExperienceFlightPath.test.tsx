import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { siteContent, type ExperienceEntry } from '@/content/site-content'
import { buildExperienceTimeline } from '@/lib/experience-flight-path'

import { ExperienceFlightPath } from './ExperienceFlightPath'

describe('ExperienceFlightPath', () => {
  it('keeps the introduction focused on the Experience heading', () => {
    const { container } = render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Experience' })).toBeVisible()
    expect(container.querySelector('.experience-timeline__intro-copy')).toBeNull()
    expect(screen.queryByText(/One shared route/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Every company and role/)).not.toBeInTheDocument()
  })

  it('server-renders every timeline stop with its details collapsed', () => {
    const markup = renderToString(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    expect(markup).toContain('Professional experience and education')
    expect(markup).toContain('id="experience-stop-uva-ml-research"')
    expect(markup).toContain('id="experience-stop-scale-ai"')
    expect(markup).toContain('id="experience-stop-refraction-innovation-hub"')
    expect(markup).toContain('id="experience-stop-education-university-of-virginia"')
    expect(markup.match(/name="experience-timeline"/g)).toHaveLength(4)
    expect(markup).not.toMatch(/<details[^>]*\sopen(?:=|>)/)
    expect(markup).toContain('/icarus-atlas/experience-trajectory-1600.webp')
    expect(markup).not.toContain('data-experience-flight-enhanced')
  })

  it('keeps every company and role visible while descriptions stay collapsed', () => {
    const { container } = render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    const rail = container.querySelector('.experience-timeline__rail')
    const timeline = screen.getByRole('list', {
      name: 'Professional experience and education',
    })
    expect(rail).toContainElement(timeline)
    expect(timeline).toHaveStyle('--experience-stop-count: 4')
    expect(timeline.children).toHaveLength(4)

    for (const entry of siteContent.experience) {
      const stop = document.getElementById(`experience-stop-${entry.id}`)
      expect(stop).not.toBeNull()
      expect(
        within(stop!).getByRole('heading', { name: entry.organization }),
      ).toBeInTheDocument()
      expect(within(stop!).getByText(entry.role, { exact: false })).toBeVisible()
      expect(within(stop!).getByText(entry.period)).toBeVisible()
      expect(within(stop!).getByText(entry.location)).toBeVisible()
      expect(within(stop!).getByText(entry.summary)).not.toBeVisible()
      expect(
        within(stop!).getByLabelText(
          `Details for ${entry.role} at ${entry.organization}`,
        ),
      ).toBeVisible()
      expect(within(stop!).getByRole('group')).not.toHaveAttribute('open')
    }

    const [education] = siteContent.education
    const educationStop = document.getElementById(
      'experience-stop-education-university-of-virginia',
    )
    expect(within(educationStop!).getByText(education.degree)).toBeVisible()
    expect(within(educationStop!).getByText(`GPA ${education.gpa}`)).not.toBeVisible()
  })

  it('maps three job lines below one axis and the UVA degree star above it', () => {
    const { container } = render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )
    const timeline = buildExperienceTimeline(
      siteContent.experience,
      siteContent.education,
    )
    const map = screen.getByRole('navigation', {
      name: 'Experience date map',
    })
    const durationLines = within(map).getByRole('list', {
      name: 'Professional duration lines',
    })
    const links = within(map).getAllByRole('link')

    expect(durationLines.children).toHaveLength(3)
    expect(links).toHaveLength(4)
    expect(container.querySelectorAll('.experience-timeline__spine-line'))
      .toHaveLength(1)

    siteContent.experience.forEach((entry, index) => {
      const item = timeline.items[index]
      const line = within(durationLines).getByLabelText(
        `${entry.role} at ${entry.organization}, ${entry.period}`,
      )

      expect(line).toHaveAttribute('href', `#experience-stop-${entry.id}`)
      expect(line.closest('li')).toHaveStyle({
        '--experience-lane-end': `${item.end * 100}%`,
        '--experience-lane-index': `${index}`,
        '--experience-lane-start': `${item.start * 100}%`,
      })
      expect(line.querySelector('.experience-timeline__duration-bar')).not.toBeNull()
    })

    const [education] = siteContent.education
    const educationItem = timeline.items[siteContent.experience.length]
    const educationStar = within(map).getByLabelText(
      `${education.degree} at ${education.institution}, ${education.graduation}`,
    )
    expect(educationStar).toHaveAttribute(
      'href',
      '#experience-stop-education-university-of-virginia',
    )
    expect(educationStar).toHaveStyle(
      `--experience-position: ${educationItem.end * 100}%`,
    )
    expect(educationStar.querySelector('.experience-timeline__milestone-star'))
      .toHaveTextContent('✦')
  })

  it('opens only the pressed role and collapses it when pressed again', () => {
    render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    const [first, second] = siteContent.experience
    const firstButton = screen.getByLabelText(
      `Details for ${first.role} at ${first.organization}`,
    )
    const secondButton = screen.getByLabelText(
      `Details for ${second.role} at ${second.organization}`,
    )
    const firstDisclosure = firstButton.closest('details')
    const secondDisclosure = secondButton.closest('details')

    fireEvent.click(firstButton)

    expect(firstDisclosure).toHaveAttribute('open')
    expect(screen.getByText(first.summary)).toBeVisible()
    expect(screen.getByText(first.highlights[0])).toBeVisible()
    expect(
      screen.getByRole('list', { name: `${first.organization} technologies` }),
    ).toHaveTextContent(first.technologies.join(''))

    fireEvent.click(secondButton)

    expect(firstDisclosure).not.toHaveAttribute('open')
    expect(screen.getByText(first.summary)).not.toBeVisible()
    expect(secondDisclosure).toHaveAttribute('open')
    expect(screen.getByText(second.summary)).toBeVisible()

    fireEvent.click(secondButton)

    expect(secondDisclosure).not.toHaveAttribute('open')
    expect(screen.getByText(second.summary)).not.toBeVisible()
  })

  it('keeps a readable stop when optional logo and location data are absent', () => {
    const entry: ExperienceEntry = {
      ...siteContent.experience[0],
      id: 'minimal-role',
      location: null,
      logo: null,
    }

    const { container } = render(
      <ExperienceFlightPath education={[]} experience={[entry]} />,
    )

    const stop = document.getElementById('experience-stop-minimal-role')
    expect(stop).not.toBeNull()
    expect(within(stop!).getByText(entry.organization)).toBeVisible()
    expect(within(stop!).getByText('—')).toBeVisible()
    expect(container.querySelector('.experience-timeline__node-mark')).toBeInTheDocument()
  })
})

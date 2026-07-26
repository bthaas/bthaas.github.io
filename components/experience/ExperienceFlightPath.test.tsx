import { fireEvent, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import { ExperienceFlightPath } from './ExperienceFlightPath'

describe('ExperienceFlightPath', () => {
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
    render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    const timeline = screen.getByRole('list', {
      name: 'Professional experience and education',
    })
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
})

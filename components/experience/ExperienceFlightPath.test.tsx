import { render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import { ExperienceFlightPath } from './ExperienceFlightPath'

describe('ExperienceFlightPath', () => {
  it('server-renders the complete reading experience before motion enhancement', () => {
    const markup = renderToString(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    expect(markup).toContain('Professional experience and education')
    expect(markup).toContain('id="experience-chapter-uva-ml-research"')
    expect(markup).toContain('id="experience-chapter-scale-ai"')
    expect(markup).toContain('id="experience-chapter-refraction-innovation-hub"')
    expect(markup).toContain('id="experience-chapter-education-university-of-virginia"')
    expect(markup).toContain('/icarus-atlas/experience-trajectory-1600.webp')
    expect(markup).not.toContain('data-experience-flight-enhanced')
  })

  it('keeps every chapter, highlight, technology, and education detail readable', () => {
    render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    const chapters = screen.getByRole('list', {
      name: 'Professional experience and education',
    })
    expect(chapters.children).toHaveLength(4)

    for (const entry of siteContent.experience) {
      const chapter = document.getElementById(`experience-chapter-${entry.id}`)
      expect(chapter).not.toBeNull()
      expect(
        within(chapter!).getByRole('heading', { name: entry.organization }),
      ).toBeInTheDocument()
      expect(within(chapter!).getByText(entry.summary)).toBeInTheDocument()
      for (const highlight of entry.highlights) {
        expect(screen.getByText(highlight)).toBeInTheDocument()
      }
      expect(
        screen.getByRole('list', { name: `${entry.organization} technologies` }),
      ).toHaveTextContent(entry.technologies.join(''))
    }

    const [education] = siteContent.education
    expect(screen.getByText(`GPA ${education.gpa}`)).toBeInTheDocument()
    const coursework = screen.getByRole('list', {
      name: `${education.institution} coursework`,
    })
    const focusAreas = screen.getByRole('list', {
      name: `${education.institution} focus areas`,
    })
    for (const course of education.coursework) {
      expect(within(coursework).getByText(course)).toBeInTheDocument()
    }
    for (const focus of education.focusAreas) {
      expect(within(focusAreas).getByText(focus)).toBeInTheDocument()
    }
  })

  it('uses native in-page links for the visual route navigator', () => {
    render(
      <ExperienceFlightPath
        education={siteContent.education}
        experience={siteContent.experience}
      />,
    )

    const route = screen.getByRole('navigation', { name: 'Career timeline' })
    const links = within(route).getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#experience-chapter-uva-ml-research',
      '#experience-chapter-scale-ai',
      '#experience-chapter-refraction-innovation-hub',
      '#experience-chapter-education-university-of-virginia',
    ])
  })
})

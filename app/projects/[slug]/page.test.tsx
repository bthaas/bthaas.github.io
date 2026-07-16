import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { fireEvent, render, screen } from '@testing-library/react'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

import { siteContent } from '@/content/site-content'

import ProjectPage, { generateMetadata, generateStaticParams } from './page'

describe('project detail pages', () => {
  it('keeps the project title and description in normal document flow while scrolling', () => {
    const stylesheet = readFileSync(
      resolve(process.cwd(), 'app/styles/projects.css'),
      'utf8',
    )
    const stickyProjectTitleRules: string[] = []

    postcss.parse(stylesheet).walkRules((rule) => {
      if (!rule.selector.includes('.project-title')) return

      rule.walkDecls('position', (declaration) => {
        if (declaration.value === 'sticky') stickyProjectTitleRules.push(rule.selector)
      })
    })

    expect(stickyProjectTitleRules).toEqual([])
  })

  it('statically generates one route for every selected project', () => {
    expect(generateStaticParams()).toEqual(
      siteContent.projects.map(({ id }) => ({ slug: id })),
    )
  })

  it('renders the full case study on its dedicated route', async () => {
    const page = await ProjectPage({
      params: Promise.resolve({ slug: 'courtvision' }),
    })
    render(page)

    expect(screen.getByRole('heading', { level: 1, name: 'Court Vision' })).toBeInTheDocument()
    const brandLink = screen.getByRole('link', { name: 'Brett Haas' })
    expect(brandLink).toHaveAttribute('href', '/')
    expect(brandLink.querySelector('img')).toHaveAttribute('src', '/original-wing-filled.png')
    expect(brandLink.querySelector('img')).toHaveAttribute('alt', '')
    expect(screen.getByRole('link', { name: 'Back to projects' })).toHaveAttribute(
      'href',
      '/#projects',
    )
    expect(screen.getByRole('link', { name: 'All projects' })).toHaveAttribute(
      'href',
      '/#projects',
    )
    expect(screen.getByRole('link', { name: 'View Court Vision repository' })).toHaveAttribute(
      'href',
      'https://github.com/bthaas/CourtVision',
    )
    expect(screen.getByRole('img', {
      name: 'A geometric arena with analytical trajectory arcs',
    })).toBeInTheDocument()

    const results = screen.getByTestId('project-results')
    expect(results).not.toHaveAttribute('open')
    fireEvent.click(screen.getByText('View project results'))
    expect(results).toHaveAttribute('open')
    expect(screen.getByText('89%')).toBeInTheDocument()
    expect(screen.getByText('<200ms')).toBeInTheDocument()
  })

  it('publishes project-specific metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'beatstream' }),
    })

    expect(metadata.title).toBe('Beat Stream — Brett Haas')
    expect(metadata.description).toBe(siteContent.projects[1].description)
  })
})

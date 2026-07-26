import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'

import { getSkillLogos } from './SkillLogos'
import { SkillWorkbench } from './SkillWorkbench'

describe('SkillWorkbench', () => {
  const logos = getSkillLogos(siteContent.skills)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders every supported logo as an outlined, categorized tool', () => {
    const { container } = render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const tools = within(workbench).getByRole('list', { name: 'Movable technology tools' })
    const tokens = within(tools).getAllByRole('button')

    expect(tokens).toHaveLength(logos.length)
    expect(container.querySelectorAll('.skill-workbench__glyph path')).toHaveLength(logos.length)
    expect(tokens.map((token) => token.getAttribute('aria-label'))).toEqual(
      logos.map(({ category, label }) => `${label}, ${category}`),
    )

    for (const logo of logos) {
      const item = screen.getByRole('button', {
        name: `${logo.label}, ${logo.category}`,
      }).closest('li')

      expect(item).toHaveAttribute('data-skill-category', logo.categorySlug)
      expect(item).toHaveStyle({ '--skill-category-color': logo.categoryColor })
    }
  })

  it('filters by category and clears the filter from reset', () => {
    render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const filters = within(workbench).getByRole('group', { name: 'Filter skills by category' })
    const frameworks = within(filters).getByRole('button', { name: 'Frameworks' })

    fireEvent.click(frameworks)
    expect(workbench).toHaveAttribute('data-active-category', 'frameworks')
    expect(frameworks).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(frameworks)
    expect(workbench).not.toHaveAttribute('data-active-category')
    expect(frameworks).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(frameworks)
    fireEvent.click(screen.getByRole('button', { name: 'Reset workbench' }))
    expect(workbench).not.toHaveAttribute('data-active-category')
    expect(frameworks).toHaveAttribute('aria-pressed', 'false')
  })

  it('supports bounded pointer throwing and restores a token on reset', () => {
    let animate: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animate = callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const token = screen.getByRole('button', { name: 'TypeScript, Languages' })
    const capture = vi.fn()
    const release = vi.fn()
    Object.defineProperties(token, {
      setPointerCapture: { configurable: true, value: capture },
      releasePointerCapture: { configurable: true, value: release },
    })

    fireEvent.pointerDown(token, {
      button: 2,
      clientX: 100,
      clientY: 100,
      pointerId: 6,
      pointerType: 'mouse',
    })
    expect(workbench).not.toHaveAttribute('data-dragging')
    expect(capture).not.toHaveBeenCalled()

    fireEvent.pointerDown(token, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 7,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(token, {
      clientX: 200,
      clientY: 200,
      pointerId: 8,
      pointerType: 'mouse',
    })
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')
    fireEvent.pointerMove(token, {
      clientX: 144,
      clientY: 126,
      pointerId: 7,
      pointerType: 'mouse',
    })

    expect(workbench).toHaveAttribute('data-dragging', 'TypeScript')
    expect(capture).toHaveBeenCalledWith(7)
    expect(token.style.transform).toContain('translate3d(44px, 26px, 0)')

    fireEvent.pointerUp(token, {
      clientX: 144,
      clientY: 126,
      pointerId: 7,
      pointerType: 'mouse',
    })
    expect(workbench).not.toHaveAttribute('data-dragging')
    expect(release).toHaveBeenCalledWith(7)

    act(() => animate?.(performance.now() + 16))
    fireEvent.click(screen.getByRole('button', { name: 'Reset workbench' }))
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')

    fireEvent.pointerDown(token, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 9,
      pointerType: 'touch',
    })
    fireEvent.pointerCancel(token, {
      clientX: 100,
      clientY: 100,
      pointerId: 9,
      pointerType: 'touch',
    })
    expect(release).toHaveBeenCalledWith(9)
  })

  it('offers keyboard nudging and Escape-to-home without hiding the fallback grid', () => {
    render(<SkillWorkbench logos={logos} />)
    const token = screen.getByRole('button', { name: 'Python, Languages' })

    fireEvent.keyDown(token, { key: 'ArrowRight' })
    expect(token.style.transform).toContain('translate3d(12px, 0px, 0)')

    fireEvent.keyDown(token, { key: 'ArrowLeft' })
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')
    fireEvent.keyDown(token, { key: 'ArrowUp' })
    expect(token.style.transform).toContain('translate3d(0px, -12px, 0)')
    fireEvent.keyDown(token, { key: 'ArrowDown' })
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')
    fireEvent.keyDown(token, { key: 'Enter' })
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')

    fireEvent.keyDown(token, { key: 'Escape' })
    expect(token.style.transform).toContain('translate3d(0px, 0px, 0)')

    const fallback = screen.getByTestId('skill-workbench-fallback')
    expect(within(fallback).getAllByRole('listitem')).toHaveLength(logos.length)
  })
})

import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'

import { getSkillLogos } from './SkillLogos'
import { SkillWorkbench } from './SkillWorkbench'

function readTransform(token: HTMLElement) {
  const match = token.style.transform.match(
    /translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0\) rotate\((-?[\d.]+)rad\)/,
  )
  if (!match) throw new Error(`Missing rigid-body transform: ${token.style.transform}`)

  return {
    angle: Number(match[3]),
    x: Number(match[1]),
    y: Number(match[2]),
  }
}

describe('SkillWorkbench', () => {
  const logos = getSkillLogos(siteContent.skills)

  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders every supported logo as a solid, categorized tool', () => {
    const { container } = render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const tools = within(workbench).getByRole('list', { name: 'Movable technology tools' })
    const tokens = within(tools).getAllByRole('button')

    expect(tokens).toHaveLength(logos.length)
    expect(new Set(tokens.map((token) => token.style.transform)).size)
      .toBeGreaterThan(logos.length / 2)
    expect(container.querySelectorAll('.skill-workbench__glyph path')).toHaveLength(logos.length)
    expect(tokens.map((token) => token.getAttribute('aria-label'))).toEqual(
      logos.map(({ category, label }) => `${label}, ${category}`),
    )
    expect(new Set(tokens.map((token) => token.getAttribute('data-skill-size'))))
      .toEqual(new Set(['compact', 'small', 'medium', 'large']))
    expect(screen.getByRole('button', { name: 'Go, Languages' }))
      .toHaveAttribute('data-skill-size', 'compact')
    expect(screen.getByRole('button', { name: 'Python, Languages' }))
      .toHaveAttribute('data-skill-size', 'small')
    expect(screen.getByRole('button', { name: 'TypeScript, Languages' }))
      .toHaveAttribute('data-skill-size', 'medium')
    expect(screen.getByRole('button', {
      name: 'Amazon Web Services, Cloud & DevOps',
    })).toHaveAttribute('data-skill-size', 'large')

    for (const logo of logos) {
      const item = screen.getByRole('button', {
        name: `${logo.label}, ${logo.category}`,
      }).closest('li')

      expect(item).toHaveAttribute('data-skill-category', logo.categorySlug)
      expect(item).toHaveStyle({ '--skill-category-color': logo.categoryColor })
    }
  }, 15_000)

  it('filters by category', () => {
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

  })

  it('starts stuck, drops automatically, and offers a persistent stick/drop control', () => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })

    expect(workbench).toHaveAttribute('data-physics', 'stuck')
    expect(screen.getByRole('button', { name: 'Drop skills' })).toBeVisible()

    act(() => vi.advanceTimersByTime(1_000))

    expect(workbench).toHaveAttribute('data-physics', 'dropped')
    expect(screen.getByRole('button', { name: 'Stick skills' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Stick skills' }))
    expect(workbench).toHaveAttribute('data-physics', 'stuck')
    expect(screen.getByRole('button', { name: 'Drop skills' })).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: 'Drop skills' }))
    expect(workbench).toHaveAttribute('data-physics', 'dropped')
  })

  it('does not auto-drop when the visitor prefers reduced motion', () => {
    vi.useFakeTimers()
    vi.mocked(window.matchMedia).mockImplementation((query) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }))

    render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })

    act(() => vi.advanceTimersByTime(1_000))

    expect(workbench).toHaveAttribute('data-physics', 'stuck')
    expect(screen.getByRole('button', { name: 'Drop skills' })).toBeVisible()
  })

  it('preserves the selected physics mode when the arena resizes', () => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<SkillWorkbench logos={logos} />)
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })

    fireEvent(window, new Event('resize'))
    expect(workbench).toHaveAttribute('data-physics', 'stuck')

    fireEvent.click(screen.getByRole('button', { name: 'Drop skills' }))
    fireEvent(window, new Event('resize'))
    expect(workbench).toHaveAttribute('data-physics', 'dropped')
  })

  it('supports bounded pointer throwing and restores a token on reset', () => {
    let animate: FrameRequestCallback | undefined
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((
      values: Uint32Array,
    ) => {
      values[0] = 1
      return values
    }) as Crypto['getRandomValues'])
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animate = callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<SkillWorkbench logos={logos} />)
    fireEvent.click(screen.getByRole('button', { name: 'Drop skills' }))
    const workbench = screen.getByRole('region', { name: 'Interactive skill workbench' })
    const token = screen.getByRole('button', { name: 'TypeScript, Languages' })
    const tokenItem = token.closest('li')
    const homeTransform = token.style.transform
    const home = readTransform(token)
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
    expect(token.style.transform).toBe(homeTransform)
    fireEvent.pointerMove(token, {
      clientX: 144,
      clientY: 126,
      pointerId: 7,
      pointerType: 'mouse',
    })

    expect(workbench).toHaveAttribute('data-dragging', 'TypeScript')
    expect(tokenItem).toHaveAttribute('data-dragging', 'true')
    expect(capture).toHaveBeenCalledWith(7)
    expect(readTransform(token).x - home.x).toBeCloseTo(44, 1)
    expect(readTransform(token).y - home.y).toBeCloseTo(26, 1)
    act(() => animate?.(performance.now() + 8))

    fireEvent.pointerUp(token, {
      clientX: 144,
      clientY: 126,
      pointerId: 7,
      pointerType: 'mouse',
    })
    expect(workbench).not.toHaveAttribute('data-dragging')
    expect(tokenItem).not.toHaveAttribute('data-dragging')
    expect(release).toHaveBeenCalledWith(7)

    act(() => animate?.(performance.now() + 16))
    act(() => animate?.(performance.now() + 32))
    fireEvent.click(screen.getByRole('button', { name: 'Stick skills' }))
    expect(token.style.transform).toBe(homeTransform)
    act(() => animate?.(performance.now() + 40))

    fireEvent.click(screen.getByRole('button', { name: 'Drop skills' }))
    fireEvent.pointerDown(token, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 9,
      pointerType: 'touch',
    })
    fireEvent.pointerMove(token, {
      clientX: 100,
      clientY: 40,
      pointerId: 9,
      pointerType: 'touch',
    })
    fireEvent.pointerCancel(token, {
      clientX: 100,
      clientY: 40,
      pointerId: 9,
      pointerType: 'touch',
    })
    expect(release).toHaveBeenCalledWith(9)
    act(() => animate?.(performance.now() + 48))
    expect(token.style.transform).not.toBe(homeTransform)
  })

  it('offers keyboard nudging and Escape-to-home without hiding the fallback grid', () => {
    render(<SkillWorkbench logos={logos} />)
    const token = screen.getByRole('button', { name: 'Python, Languages' })
    const homeTransform = token.style.transform
    fireEvent.click(screen.getByRole('button', { name: 'Drop skills' }))
    const home = readTransform(token)

    fireEvent.keyDown(token, { key: 'ArrowRight' })
    expect(readTransform(token).x).toBeGreaterThan(home.x)

    fireEvent.keyDown(token, { key: 'ArrowLeft' })
    const afterLeft = readTransform(token)
    fireEvent.keyDown(token, { key: 'ArrowUp' })
    expect(readTransform(token).y).toBeLessThan(afterLeft.y)
    const afterUp = readTransform(token)
    fireEvent.keyDown(token, { key: 'ArrowDown' })
    expect(readTransform(token).y).toBeGreaterThan(afterUp.y)
    const afterArrows = token.style.transform
    fireEvent.keyDown(token, { key: 'Enter' })
    expect(token.style.transform).toBe(afterArrows)

    fireEvent.keyDown(token, { key: 'Escape' })
    expect(token.style.transform).toBe(homeTransform)

    const fallback = screen.getByTestId('skill-workbench-fallback')
    expect(within(fallback).getAllByRole('listitem')).toHaveLength(logos.length)
  })
})

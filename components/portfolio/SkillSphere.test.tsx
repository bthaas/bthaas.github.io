import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { spreadSkillSphereOrder } from '@/lib/atlas-motion/skill-sphere'

import { getSkillLogos } from './SkillLogos'
import { SkillSphere } from './SkillSphere'

const mediaQuery = (matches: boolean): MediaQueryList => ({
  matches,
  media: '',
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

const originalIntersectionObserver = globalThis.IntersectionObserver

describe('SkillSphere', () => {
  const logos = getSkillLogos(siteContent.skills)

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('server-renders every catalog logo as an ordered, accessible chip', () => {
    const { container } = render(<SkillSphere logos={logos} />)
    const sphere = screen.getByRole('region', { name: 'Interactive skill sphere' })
    const list = within(sphere).getByRole('list', { name: 'Skills on the sphere' })
    const chips = within(list).getAllByRole('button')

    expect(chips).toHaveLength(logos.length)
    expect(chips.map((chip) => chip.getAttribute('aria-label'))).toEqual(
      spreadSkillSphereOrder(logos.length).map((index) => logos[index].label),
    )
    expect(container.querySelectorAll('.skill-sphere__glyph path')).toHaveLength(logos.length)
    expect(container.querySelector('canvas')).not.toBeInTheDocument()
    expect(container.querySelector('[data-skill-sphere-scene]')).toBeInTheDocument()
    expect(container.querySelector('[data-skill-sphere-mesh]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    expect(container.querySelectorAll('[data-skill-sphere-edge]')).toHaveLength(77)
    expect(container.querySelectorAll('[data-sphere-row][data-sphere-meridian]'))
      .toHaveLength(logos.length)

    const react = screen.getByRole('button', { name: 'React' }).closest('li')!
    const reactNative = screen.getByRole('button', { name: 'React Native' }).closest('li')!
    const rowDistance = Math.abs(
      Number(react.dataset.sphereRow) - Number(reactNative.dataset.sphereRow),
    )
    const columnDistance = Math.abs(
      Number(react.dataset.sphereMeridian) - Number(reactNative.dataset.sphereMeridian),
    )
    expect(rowDistance + columnDistance).toBeGreaterThanOrEqual(3)
  })

  it('uses the approved Fig. 5 wayfinding and keeps decorative copy out of the tree', () => {
    const { container } = render(<SkillSphere logos={logos} />)

    expect(container.querySelector('.skill-sphere__caption')).toHaveTextContent(
      'Fig. 5 — The skill sphere',
    )
    expect(container.querySelector('.skill-sphere__hint')).toHaveTextContent('drag to navigate')
    expect(container.querySelector('.skill-sphere__caption')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('.skill-sphere__hint')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText(`Skills: ${logos.map(({ label }) => label).join(', ')}.`))
      .toHaveClass('sr-only')
  })

  it('serializes initial projection values at stable precision for hydration', () => {
    const { container } = render(<SkillSphere logos={logos} />)
    const items = Array.from(container.querySelectorAll<HTMLElement>('.skill-sphere__item'))

    expect(items).toHaveLength(logos.length)
    for (const item of items) {
      expect(item.style.getPropertyValue('--sphere-initial-left'))
        .toMatch(/^-?\d+\.\d{6}%$/)
      expect(item.style.getPropertyValue('--sphere-initial-opacity'))
        .toMatch(/^\d+\.\d{6}$/)
      expect(item.style.getPropertyValue('--sphere-initial-scale'))
        .toMatch(/^\d+\.\d{6}$/)
      expect(item.style.getPropertyValue('--sphere-initial-top'))
        .toMatch(/^-?\d+\.\d{6}%$/)
      expect(item.style.getPropertyValue('--sphere-mobile-left'))
        .toMatch(/^-?\d+\.\d{6}%$/)
      expect(item.style.getPropertyValue('--sphere-mobile-top'))
        .toMatch(/^-?\d+\.\d{6}%$/)
    }
  })

  it('shows the label and pauses rotation on keyboard focus, then clears with Escape', () => {
    render(<SkillSphere logos={logos} />)
    const sphere = screen.getByTestId('skill-sphere')
    const chip = screen.getByRole('button', { name: 'TypeScript' })

    act(() => chip.focus())
    expect(sphere).toHaveAttribute('data-active-skill', 'TypeScript')
    expect(sphere).toHaveAttribute('data-paused', 'true')
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(within(chip).getByText('TypeScript')).toBeVisible()
    expect(document.querySelectorAll('[data-skill-sphere-edge][data-active="true"]'))
      .toHaveLength(12)

    fireEvent.keyDown(chip, { key: 'Escape' })
    expect(sphere).not.toHaveAttribute('data-active-skill')
    expect(sphere).toHaveAttribute('data-paused', 'false')
    expect(document.querySelectorAll('[data-skill-sphere-edge][data-active="true"]'))
      .toHaveLength(0)
  })

  it('captures free-direction pointer drags and releases into inertia', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery(false))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    render(<SkillSphere logos={logos} />)
    const sphere = screen.getByTestId('skill-sphere')
    const scene = screen.getByTestId('skill-sphere-scene')
    const capture = vi.fn()
    const release = vi.fn()
    Object.defineProperties(scene, {
      setPointerCapture: { configurable: true, value: capture },
      releasePointerCapture: { configurable: true, value: release },
    })

    fireEvent.pointerDown(scene, { pointerId: 7, clientX: 160, clientY: 140 })
    fireEvent.pointerMove(scene, { pointerId: 7, clientX: 205, clientY: 112 })
    expect(sphere).toHaveAttribute('data-dragging', 'true')
    expect(capture).toHaveBeenCalledWith(7)

    fireEvent.pointerUp(scene, { pointerId: 7, clientX: 205, clientY: 112 })
    expect(sphere).toHaveAttribute('data-dragging', 'false')
    expect(release).toHaveBeenCalledWith(7)
  })

  it('runs the mobile idle frame and reports its measured frame rate', () => {
    vi.stubGlobal('innerWidth', 390)
    class VisibleObserver {
      private readonly callback: IntersectionObserverCallback

      constructor(callback: IntersectionObserverCallback) {
        this.callback = callback
      }

      disconnect = vi.fn()
      observe = vi.fn((target: Element) => this.callback([
        { isIntersecting: true, target } as IntersectionObserverEntry,
      ], this as unknown as IntersectionObserver))
      takeRecords = vi.fn(() => [])
      unobserve = vi.fn()
    }
    globalThis.IntersectionObserver = VisibleObserver as unknown as typeof IntersectionObserver
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => mediaQuery(
      query.includes('pointer: coarse'),
    ))
    let animate: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      animate ??= callback
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<SkillSphere logos={logos} />)
    const sphere = screen.getByTestId('skill-sphere')

    expect(animate).toBeTypeOf('function')
    act(() => animate?.(performance.now() + 1_100))
    expect(sphere).toHaveAttribute('data-skill-sphere-fps')
    expect(sphere).toHaveAttribute('data-auto-rotate', 'true')
  })

  it('stops the animation frame loop outside the viewport and restarts it on return', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery(false))
    let animate: FrameRequestCallback | undefined
    let updateVisibility: IntersectionObserverCallback | undefined
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      animate = callback
      return 1
    })
    const cancelFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelFrame)
    class VisibilityObserver {
      constructor(callback: IntersectionObserverCallback) {
        updateVisibility = callback
      }
      disconnect = vi.fn()
      observe = vi.fn()
      takeRecords = vi.fn(() => [])
      unobserve = vi.fn()
    }
    globalThis.IntersectionObserver = VisibilityObserver as unknown as typeof IntersectionObserver

    const { container } = render(<SkillSphere logos={logos} />)
    const item = container.querySelector<HTMLElement>('.skill-sphere__item')!
    const before = item.style.getPropertyValue('--sphere-transform')
    expect(requestFrame).not.toHaveBeenCalled()

    act(() => updateVisibility?.([
      { isIntersecting: true } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    expect(requestFrame).toHaveBeenCalledTimes(1)

    act(() => updateVisibility?.([
      { isIntersecting: false } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    expect(cancelFrame).toHaveBeenCalledWith(1)
    expect(item.style.getPropertyValue('--sphere-transform')).toBe(before)

    act(() => updateVisibility?.([
      { isIntersecting: true } as IntersectionObserverEntry,
    ], {} as IntersectionObserver))
    expect(requestFrame).toHaveBeenCalledTimes(2)
    act(() => animate?.(performance.now() + 1_200))
    expect(item.style.getPropertyValue('--sphere-transform')).not.toBe(before)
  })

  it('handles desktop hover, background clearing, and drag-click suppression', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery(false))
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    render(<SkillSphere logos={logos} />)
    const sphere = screen.getByTestId('skill-sphere')
    const scene = screen.getByTestId('skill-sphere-scene')
    const chip = screen.getByRole('button', { name: 'TypeScript' })

    fireEvent.pointerEnter(chip, { pointerType: 'mouse' })
    expect(sphere).toHaveAttribute('data-active-skill', 'TypeScript')
    fireEvent.pointerLeave(chip, { pointerType: 'mouse' })
    expect(sphere).not.toHaveAttribute('data-active-skill')

    fireEvent.click(chip)
    expect(sphere).toHaveAttribute('data-active-skill', 'TypeScript')
    fireEvent.pointerDown(scene, { pointerId: 4, clientX: 90, clientY: 90 })
    expect(sphere).not.toHaveAttribute('data-active-skill')
    fireEvent.pointerMove(scene, { pointerId: 4, clientX: 130, clientY: 70 })
    fireEvent.pointerUp(scene, { pointerId: 4, clientX: 130, clientY: 70 })
    fireEvent.click(chip)
    expect(sphere).not.toHaveAttribute('data-active-skill')

    fireEvent.pointerDown(scene, {
      button: 1,
      pointerId: 5,
      pointerType: 'mouse',
    })
    expect(sphere).toHaveAttribute('data-dragging', 'false')
    fireEvent.keyDown(chip, { key: 'Enter' })
    expect(sphere).not.toHaveAttribute('data-active-skill')
  })

  it('toggles a label on touch without hiding any skills', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => mediaQuery(
      query.includes('pointer: coarse') || query.includes('prefers-reduced-motion'),
    ))
    render(<SkillSphere logos={logos} />)
    const sphere = screen.getByTestId('skill-sphere')
    const chip = screen.getByRole('button', { name: 'Python' })

    fireEvent.click(chip)
    expect(sphere).toHaveAttribute('data-active-skill', 'Python')
    fireEvent.blur(chip)
    expect(sphere).toHaveAttribute('data-active-skill', 'Python')
    fireEvent.click(chip)
    expect(sphere).not.toHaveAttribute('data-active-skill')
    expect(screen.getAllByRole('button')).toHaveLength(logos.length)
  })

  it('runs no animation loop in the reduced-motion tier', () => {
    const requestFrame = vi.spyOn(window, 'requestAnimationFrame')
    render(<SkillSphere logos={logos} />)

    const scene = screen.getByTestId('skill-sphere-scene')
    fireEvent.pointerDown(scene, { pointerId: 9, clientX: 80, clientY: 80 })
    fireEvent.pointerMove(scene, { pointerId: 9, clientX: 110, clientY: 60 })
    fireEvent.pointerCancel(scene, { pointerId: 9 })

    expect(screen.getByTestId('skill-sphere')).toHaveAttribute('data-motion', 'reduced')
    expect(screen.getByTestId('skill-sphere')).toHaveAttribute('data-auto-rotate', 'false')
    expect(screen.getByTestId('skill-sphere')).toHaveAttribute('data-dragging', 'false')
    expect(requestFrame).not.toHaveBeenCalled()
  })
})

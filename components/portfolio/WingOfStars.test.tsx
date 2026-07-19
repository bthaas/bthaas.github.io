import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { WING_EDGES, WING_STAR_ORDER } from '@/lib/atlas-motion/wing-of-stars'

import { getSkillLogos } from './SkillLogos'
import { WingOfStars } from './WingOfStars'

const defaultIntersectionObserver = globalThis.IntersectionObserver

describe('WingOfStars', () => {
  const logos = getSkillLogos(siteContent.skills)

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.IntersectionObserver = defaultIntersectionObserver
  })

  it('renders every skill as an ordered, keyboard-focusable star', () => {
    const { container } = render(<WingOfStars logos={logos} />)
    const chart = screen.getByRole('region', { name: 'Wing of Stars skill chart' })
    const list = within(chart).getByRole('list', { name: 'Skills mapped as stars' })
    const stars = within(list).getAllByRole('button')

    expect(stars).toHaveLength(logos.length)
    expect(stars.map((star) => star.getAttribute('aria-label'))).toEqual(WING_STAR_ORDER)
    stars.forEach((star) => expect(star).toHaveAttribute('type', 'button'))
    expect(container.querySelectorAll('[data-wing-edge]')).toHaveLength(WING_EDGES.length)
    expect(container.querySelector('[data-wing-outline]')).toBeInTheDocument()
    expect(container.querySelector('[data-wing-shooting-star]')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
  })

  it('describes the full skills list without relying on constellation theatrics', () => {
    render(<WingOfStars logos={logos} />)

    expect(screen.getByText(`Skills: ${logos.map(({ label }) => label).join(', ')}.`)).toHaveClass(
      'sr-only',
    )
    expect(screen.getByText('Chart 03 — Navigate by skill')).toBeVisible()
    expect(screen.getByText('Languages · Frontend · Data · Cloud + infra · ML + AI')).toBeVisible()
  })

  it('flares on focus, keeps focus visible through pointer leave, and clears on Escape or blur', () => {
    render(<WingOfStars logos={logos} />)
    const star = screen.getByRole('button', { name: 'TypeScript' })

    act(() => star.focus())
    expect(star).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('wing-chart')).toHaveAttribute('data-active-skill', 'TypeScript')
    fireEvent.pointerLeave(star)
    expect(star).toHaveAttribute('data-active', 'true')

    fireEvent.keyDown(star, { key: 'Escape' })
    expect(screen.getByTestId('wing-chart')).not.toHaveAttribute('data-active-skill')

    act(() => star.focus())
    act(() => star.blur())
    expect(screen.getByTestId('wing-chart')).not.toHaveAttribute('data-active-skill')
  })

  it('toggles a star on coarse pointers and clears when the chart background is tapped', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: query.includes('prefers-reduced-motion') || query.includes('pointer: coarse'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(<WingOfStars logos={logos} />)
    const chart = screen.getByTestId('wing-chart')
    const star = screen.getByRole('button', { name: 'Python' })

    fireEvent.click(star)
    expect(star).toHaveAttribute('data-active', 'true')
    fireEvent.blur(star)
    expect(star).toHaveAttribute('data-active', 'true')
    fireEvent.click(star)
    expect(star).not.toHaveAttribute('data-active')
    fireEvent.click(star)
    fireEvent.pointerDown(chart)
    expect(star).not.toHaveAttribute('data-active')
    fireEvent.click(star)
    fireEvent.pointerDown(document.body)
    expect(star).not.toHaveAttribute('data-active')
  })

  it('marks its reduced-motion presentation as fully drawn and static', () => {
    const { container } = render(<WingOfStars logos={logos} />)

    expect(screen.getByTestId('wing-chart')).toHaveAttribute('data-motion', 'reduced')
    expect(container.querySelectorAll('[data-wing-star]')).toHaveLength(logos.length)
    expect(container.querySelectorAll('[data-wing-edge]')).toHaveLength(WING_EDGES.length)
  })

  it('orchestrates the desktop entrance, idle sky, parallax, shooting star, and flare', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    let intersectionUpdate: IntersectionObserverCallback | undefined
    const disconnect = vi.fn()
    const observe = vi.fn()
    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        intersectionUpdate = callback
      }

      disconnect = disconnect
      observe = observe
    } as unknown as typeof IntersectionObserver

    const tweenControls = {
      kill: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    }
    let delayedCallback: (() => void) | undefined
    const delayedCall = vi.spyOn(gsap, 'delayedCall').mockImplementation((_, callback) => {
      delayedCallback = () => callback()
      return tweenControls as unknown as gsap.core.Tween
    })
    const to = vi.spyOn(gsap, 'to').mockReturnValue(
      tweenControls as unknown as gsap.core.Tween,
    )
    const set = vi.spyOn(gsap, 'set').mockReturnValue(
      tweenControls as unknown as gsap.core.Tween,
    )
    const fromTo = vi.spyOn(gsap, 'fromTo').mockReturnValue(
      tweenControls as unknown as gsap.core.Tween,
    )
    const quickTweens = Array.from({ length: 4 }, () => ({ kill: vi.fn() }))
    const quickSetters = quickTweens.map(
      (tween) => Object.assign(vi.fn(), { tween }) as unknown as gsap.QuickToFunc,
    )
    vi.spyOn(gsap, 'quickTo')
      .mockImplementationOnce(() => quickSetters[0])
      .mockImplementationOnce(() => quickSetters[1])
      .mockImplementationOnce(() => quickSetters[2])
      .mockImplementationOnce(() => quickSetters[3])

    const timelines: Array<{
      config: gsap.TimelineVars
      kill: ReturnType<typeof vi.fn>
      pause: ReturnType<typeof vi.fn>
      play: ReturnType<typeof vi.fn>
      resume: ReturnType<typeof vi.fn>
      set: ReturnType<typeof vi.fn>
      to: ReturnType<typeof vi.fn>
    }> = []
    vi.spyOn(gsap, 'timeline').mockImplementation((config = {}) => {
      const timeline = {
        config,
        kill: vi.fn(),
        pause: vi.fn(),
        play: vi.fn(() => {
          config.onComplete?.()
          return timeline
        }),
        resume: vi.fn(),
        set: vi.fn(() => timeline),
        to: vi.fn(() => timeline),
      }
      timelines.push(timeline)
      return timeline as unknown as gsap.core.Timeline
    })
    const triggerKill = vi.fn()
    vi.spyOn(ScrollTrigger, 'create').mockReturnValue({
      kill: triggerKill,
    } as unknown as ScrollTrigger)

    const { unmount } = render(<WingOfStars logos={logos} />)
    const chart = screen.getByTestId('wing-chart')
    const typeScript = screen.getByRole('button', { name: 'TypeScript' })

    expect(chart).toHaveAttribute('data-motion', 'full')
    expect(observe).toHaveBeenCalledWith(chart)

    act(() => intersectionUpdate?.(
      [{ isIntersecting: true, target: chart } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ))
    expect(timelines[0].play).toHaveBeenCalledWith(0)
    expect(delayedCall).toHaveBeenCalledTimes(1)

    act(() => delayedCallback?.())
    expect(timelines).toHaveLength(2)
    expect(timelines[1].set).toHaveBeenCalled()
    expect(timelines[1].to).toHaveBeenCalledTimes(3)

    const idleVars = to.mock.calls.find(([, vars]) => vars && 'repeat' in vars)?.[1]
    expect(typeof idleVars?.delay).toBe('function')
    expect((idleVars?.delay as (index: number) => number)(8)).toBeCloseTo(0.19)
    expect((idleVars?.duration as (index: number) => number)(4)).toBeCloseTo(4.48)
    expect((idleVars?.opacity as (index: number) => number)(3)).toBeCloseTo(0.715)
    expect((idleVars?.scale as (index: number) => number)(2)).toBeCloseTo(1.02)

    fireEvent.pointerEnter(chart)
    fireEvent.pointerMove(chart, { clientX: 100, clientY: 80 })
    fireEvent.pointerLeave(chart)
    fireEvent(window, new Event('resize'))
    quickSetters.forEach((setter) => expect(setter).toHaveBeenCalled())

    fireEvent.pointerEnter(typeScript)
    expect(chart).toHaveAttribute('data-active-skill', 'TypeScript')
    expect(fromTo).toHaveBeenCalled()
    fireEvent.pointerLeave(typeScript)
    expect(chart).not.toHaveAttribute('data-active-skill')
    fireEvent.click(typeScript)
    expect(chart).toHaveAttribute('data-active-skill', 'TypeScript')

    act(() => intersectionUpdate?.(
      [{ isIntersecting: false, target: chart } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ))
    expect(tweenControls.pause).toHaveBeenCalled()

    fireEvent.pointerDown(typeScript)
    expect(chart).toHaveAttribute('data-active-skill', 'TypeScript')
    fireEvent.pointerDown(document.body)
    expect(chart).toHaveAttribute('data-active-skill', 'TypeScript')

    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(triggerKill).toHaveBeenCalled()
    quickTweens.forEach((tween) => expect(tween.kill).toHaveBeenCalled())
    expect(set).toHaveBeenCalled()
  })
})

import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Portfolio } from './Portfolio'

const animation = vi.hoisted(() => ({
  cancelFrame: vi.fn(),
  contextRevert: vi.fn(),
  fromTo: vi.fn(),
  lenisDestroy: vi.fn(),
  lenisOn: vi.fn(),
  lenisRaf: vi.fn(),
  refresh: vi.fn(),
  registerPlugin: vi.fn(),
  timelineFromTo: vi.fn(),
  timelineOptions: [] as Array<Record<string, unknown>>,
  timelineTo: vi.fn(),
  update: vi.fn(),
}))

vi.mock('../scenes/HeroExperience', () => ({
  HeroExperience: () => <div data-testid="hero-experience" />,
}))

vi.mock('../scenes/SectionSceneExperience', () => ({
  SectionSceneExperience: () => <div data-testid="section-experience" />,
}))

vi.mock('gsap', () => ({
  gsap: {
    context: (callback: () => void) => {
      callback()
      return { revert: animation.contextRevert }
    },
    fromTo: animation.fromTo,
    registerPlugin: animation.registerPlugin,
    timeline: (options: Record<string, unknown>) => {
      animation.timelineOptions.push(options)
      const timeline = {
        fromTo: (...args: unknown[]) => {
          animation.timelineFromTo(...args)
          return timeline
        },
        to: (...args: unknown[]) => {
          animation.timelineTo(...args)
          return timeline
        },
      }
      return timeline
    },
    utils: {
      toArray: (selector: string) => Array.from(document.querySelectorAll(selector)),
    },
  },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: animation.refresh,
    update: animation.update,
  },
}))

vi.mock('lenis', () => ({
  default: class MockLenis {
    destroy = animation.lenisDestroy
    on = animation.lenisOn
    raf = animation.lenisRaf
  },
}))

function installMotionPreference(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

describe('Portfolio scroll experience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    animation.timelineOptions.length = 0
    installMotionPreference(false)
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn(() => 37),
    })
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: animation.cancelFrame,
    })
    window.history.replaceState({}, '', '/')
  })

  it('initializes on intent, updates progress, and releases every animation resource', async () => {
    const { unmount } = render(<Portfolio />)

    act(() => window.dispatchEvent(new WheelEvent('wheel')))
    await waitFor(() => expect(animation.refresh).toHaveBeenCalledTimes(1))

    expect(animation.registerPlugin).toHaveBeenCalledTimes(1)
    expect(animation.lenisOn).toHaveBeenCalledWith('scroll', animation.update)
    expect(animation.timelineTo).toHaveBeenCalled()
    expect(animation.timelineFromTo).toHaveBeenCalled()
    expect(animation.fromTo).toHaveBeenCalled()

    const scrollTrigger = animation.timelineOptions[0].scrollTrigger as {
      onUpdate: (state: { progress: number }) => void
    }
    act(() => scrollTrigger.onUpdate({ progress: 0.625 }))
    expect(document.documentElement.style.getPropertyValue('--hero-progress')).toBe('0.625')

    animation.timelineOptions.slice(1).forEach((options, index) => {
      const sectionTrigger = options.scrollTrigger as {
        onUpdate: (state: { progress: number }) => void
      }
      act(() => sectionTrigger.onUpdate({ progress: 0.375 + index * 0.01 }))
    })
    expect(document.documentElement.style.getPropertyValue('--about-progress')).toBe('0.375')
    expect(document.documentElement.style.getPropertyValue('--ending-progress')).toBe('0.405')
    expect(document.querySelector<HTMLElement>('[data-cloud-transition]')?.style.getPropertyValue('--transition-progress')).toBe('0.415')

    const rafCallback = vi.mocked(window.requestAnimationFrame).mock.calls[0]?.[0]
    act(() => rafCallback?.(120))
    expect(animation.lenisRaf).toHaveBeenCalledWith(120)

    unmount()
    expect(animation.cancelFrame).toHaveBeenCalledWith(37)
    expect(animation.contextRevert).toHaveBeenCalled()
    expect(animation.lenisDestroy).toHaveBeenCalled()
    expect(document.documentElement.style.getPropertyValue('--hero-progress')).toBe('')
    expect(document.documentElement.style.getPropertyValue('--about-progress')).toBe('')
  })

  it('starts from supported keyboard navigation keys only', async () => {
    render(<Portfolio />)

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' })))
    expect(animation.refresh).not.toHaveBeenCalled()

    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' })))
    await waitFor(() => expect(animation.refresh).toHaveBeenCalledTimes(1))
  })

  it('does not finish initialization after an immediate teardown', async () => {
    const { unmount } = render(<Portfolio />)

    act(() => window.dispatchEvent(new TouchEvent('touchstart')))
    unmount()
    await act(async () => Promise.resolve())

    expect(animation.registerPlugin).not.toHaveBeenCalled()
  })

  it('uses static content and no animation resources for reduced motion', () => {
    installMotionPreference(true)
    const { unmount } = render(<Portfolio />)

    expect(document.documentElement.dataset.motion).toBe('reduce')
    expect(animation.registerPlugin).not.toHaveBeenCalled()

    unmount()
    expect(document.documentElement.dataset.motion).toBeUndefined()
  })
})

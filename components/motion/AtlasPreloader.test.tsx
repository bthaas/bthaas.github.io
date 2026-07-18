import { act, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const motion = vi.hoisted(() => ({
  complete: undefined as (() => void) | undefined,
  fromTo: vi.fn(),
  kill: vi.fn(),
  registerPlugin: vi.fn(),
  to: vi.fn(),
}))

vi.mock('@gsap/react', async () => {
  const { useEffect } = await vi.importActual<typeof import('react')>('react')
  return {
    useGSAP: (
      callback: () => void | (() => void),
      options?: { readonly dependencies?: readonly unknown[] },
    ) => useEffect(callback, options?.dependencies),
  }
})

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: motion.registerPlugin,
    timeline: (options: { readonly onComplete?: () => void }) => {
      motion.complete = options.onComplete
      const timeline = {
        fromTo: (...args: unknown[]) => {
          motion.fromTo(...args)
          return timeline
        },
        kill: motion.kill,
        to: (target: unknown, vars: { readonly onUpdate?: () => void; readonly progress?: number }) => {
          motion.to(target, vars)
          if (typeof target === 'object' && target !== null && 'progress' in target) {
            ;(target as { progress: number }).progress = vars.progress ?? 1
            vars.onUpdate?.()
          }
          return timeline
        },
      }
      return timeline
    },
  },
}))

vi.mock('gsap/DrawSVGPlugin', () => ({ DrawSVGPlugin: {} }))

import { AtlasPreloader } from './AtlasPreloader'

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

describe('AtlasPreloader', () => {
  beforeEach(() => {
    sessionStorage.clear()
    document.documentElement.className = ''
    motion.complete = undefined
    motion.fromTo.mockClear()
    motion.kill.mockClear()
    motion.to.mockClear()
  })

  it('server-renders nothing so paint and no-JS reading are never blocked', () => {
    expect(renderToString(<AtlasPreloader />)).toBe('')
  })

  it('mounts no overlay when the global reduced-motion kill switch is active', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)))
    const { container } = render(<AtlasPreloader />)

    expect(container).toBeEmptyDOMElement()
    expect(document.documentElement).not.toHaveClass('atlas-preloader-active')
  })

  it('draws once, records the session, and releases the Atlas masthead', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)))
    const completed = vi.fn()
    window.addEventListener('atlas:preloader-complete', completed, { once: true })

    const { container } = render(<AtlasPreloader />)

    await waitFor(() => expect(container.querySelector('[data-atlas-preloader]')).toBeVisible())
    expect(document.documentElement).toHaveClass('atlas-preloader-active')
    expect(screen.getByText('100')).toHaveAttribute('data-atlas-preloader-counter')
    expect(motion.fromTo).toHaveBeenCalledWith(
      expect.any(Array),
      { drawSVG: '0%' },
      expect.objectContaining({ drawSVG: '100%' }),
      0.04,
    )

    act(() => motion.complete?.())

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(sessionStorage.getItem('atlas-preloader-entered')).toBe('1')
    expect(document.documentElement).not.toHaveClass('atlas-preloader-active')
    expect(completed).toHaveBeenCalledOnce()
  })

  it('stays absent after the entrance has been seen in the current session', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)))
    sessionStorage.setItem('atlas-preloader-entered', '1')
    const { container } = render(<AtlasPreloader />)

    expect(container).toBeEmptyDOMElement()
    expect(motion.fromTo).not.toHaveBeenCalled()
  })
})

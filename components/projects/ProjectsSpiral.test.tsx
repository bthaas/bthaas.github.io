import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

import { ProjectsSpiral } from './ProjectsSpiral'

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockProjectSpiralScene(props: {
      isMobile: boolean
      onReady: () => void
      showStats: boolean
    }) {
      useEffect(() => props.onReady(), [props.onReady])
      return (
        <div
          data-mobile={String(props.isMobile)}
          data-stats={String(props.showStats)}
          data-testid="project-spiral-scene"
        />
      )
    },
}))

vi.mock('@/lib/client-capabilities', () => ({
  detectWebGLProfile: vi.fn(() => ({ available: true, constrained: false })),
  shouldRenderWebGL: vi.fn(
    ({ reducedMotion, webGLAvailable, width }) =>
      !reducedMotion && webGLAvailable && width >= 320,
  ),
}))

const mediaListeners = new Set<() => void>()
const originalIntersectionObserver = globalThis.IntersectionObserver
let reducedMotion = false

function installBrowserStubs() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({
      get matches() {
        return reducedMotion
      },
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: (_event: string, listener: () => void) => mediaListeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => mediaListeners.delete(listener),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: 1440,
    writable: true,
  })
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    globalThis.setTimeout(() => callback(16), 0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  Object.defineProperty(window, 'requestIdleCallback', {
    configurable: true,
    value: (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 24 })
      return 2
    },
  })
  Object.defineProperty(window, 'cancelIdleCallback', {
    configurable: true,
    value: vi.fn(),
  })
}

describe('ProjectsSpiral', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaListeners.clear()
    reducedMotion = false
    globalThis.IntersectionObserver = originalIntersectionObserver
    window.history.replaceState({}, '', '/')
    installBrowserStubs()
  })

  it('server-renders the complete project fallback and no WebGL canvas', () => {
    const markup = renderToString(<ProjectsSpiral projects={siteContent.projects} />)

    expect(markup).toContain('/projects/courtvision')
    expect(markup).toContain('/projects/beatstream')
    expect(markup).toContain('/projects/vision-bias-steering')
    expect(markup).toContain('/icarus-atlas/project-courtvision-1200.webp')
    expect(markup).not.toContain('project-spiral-scene')
  })

  it('keeps three semantic project links in the accessible fallback', () => {
    render(<ProjectsSpiral projects={siteContent.projects} />)

    expect(screen.getAllByTestId('project-spiral-fallback-link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: /Open Beat Stream case study/i })).toHaveAttribute(
      'href',
      '/projects/beatstream',
    )
  })

  it('lazy-mounts the real mobile scene and exposes optional performance stats', async () => {
    window.innerWidth = 500
    window.history.replaceState({}, '', '/?stats=1')
    const { container } = render(<ProjectsSpiral projects={siteContent.projects} />)

    const scene = await screen.findByTestId('project-spiral-scene')
    expect(scene).toHaveAttribute('data-mobile', 'true')
    expect(scene).toHaveAttribute('data-stats', 'true')
    expect(container.querySelector('.project-spiral')).toHaveAttribute(
      'data-project-spiral-enhanced',
      '',
    )
    expect(shouldRenderWebGL).toHaveBeenCalledWith(expect.objectContaining({ width: 500 }))

    act(() => {
      reducedMotion = true
      mediaListeners.forEach((listener) => listener())
    })
    await waitFor(() => expect(screen.queryByTestId('project-spiral-scene')).not.toBeInTheDocument())
  })

  it('fails closed on browsers without WebGL', async () => {
    vi.mocked(detectWebGLProfile).mockReturnValueOnce({ available: false, constrained: false })
    const { container } = render(<ProjectsSpiral projects={siteContent.projects} />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(screen.queryByTestId('project-spiral-scene')).not.toBeInTheDocument()
    expect(container.querySelector('.project-spiral')).not.toHaveAttribute(
      'data-project-spiral-enhanced',
    )
  })

  it('clears the ready state before an offscreen scene is remounted', async () => {
    let visibilityCallback: IntersectionObserverCallback | undefined
    class VisibilityObserver implements IntersectionObserver {
      readonly root = null
      readonly rootMargin = '100% 0px'
      readonly scrollMargin = '0px'
      readonly thresholds = [0]
      constructor(callback: IntersectionObserverCallback) {
        visibilityCallback = callback
      }
      disconnect() {}
      observe() {}
      takeRecords() { return [] }
      unobserve() {}
    }
    globalThis.IntersectionObserver = VisibilityObserver

    const { container } = render(<ProjectsSpiral projects={siteContent.projects} />)
    await screen.findByTestId('project-spiral-scene')
    const stage = container.querySelector('[data-project-spiral-stage]')
    await waitFor(() => expect(stage).toHaveAttribute('data-project-spiral-ready'))

    act(() => {
      visibilityCallback?.([
        { isIntersecting: false } as IntersectionObserverEntry,
      ], {} as IntersectionObserver)
    })
    await waitFor(() => expect(screen.queryByTestId('project-spiral-scene')).not.toBeInTheDocument())
    expect(stage).not.toHaveAttribute('data-project-spiral-ready')
  })
})

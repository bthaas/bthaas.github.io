import { act, render, screen, waitFor } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { shouldRenderWebGL } from '@/lib/client-capabilities'

import { ProjectsFlightPath } from './ProjectsFlightPath'

vi.mock('next/dynamic', () => ({
  default: () =>
    function MockProjectFlightScene() {
      return <div data-testid="project-flight-scene" />
    },
}))

vi.mock('@/lib/client-capabilities', () => ({
  detectWebGLProfile: vi.fn(() => ({ available: true, constrained: false })),
  shouldRenderWebGL: vi.fn(
    ({ reducedMotion, webGLAvailable, width }) =>
      !reducedMotion && webGLAvailable && width >= 320,
  ),
}))

let reducedMotion = false
const mediaListeners = new Set<() => void>()

function installBrowserStubs() {
  Object.defineProperty(window, 'scrollTo', {
    configurable: true,
    value: vi.fn(),
  })
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

describe('ProjectsFlightPath', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mediaListeners.clear()
    reducedMotion = false
    installBrowserStubs()
  })

  it('server-renders three real case-study links and image fallbacks', () => {
    const markup = renderToString(<ProjectsFlightPath projects={siteContent.projects} />)

    expect(markup).toContain('id="project-courtvision"')
    expect(markup).toContain('id="project-beatstream"')
    expect(markup).toContain('id="project-vision-bias-steering"')
    expect(markup).toContain('/icarus-atlas/project-courtvision-1200.webp')
    expect(markup).not.toContain('project-flight-scene')
  })

  it('keeps the complete static vertical gallery and never mounts WebGL for reduced motion', async () => {
    reducedMotion = true
    render(<ProjectsFlightPath projects={siteContent.projects} />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(screen.queryByTestId('project-flight-scene')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('project-panel-trigger')).toHaveLength(3)
    expect(screen.getByRole('link', { name: /Open Beat Stream/i })).toHaveAttribute(
      'href',
      '/projects/beatstream',
    )
  })

  it('lazy-mounts one shared desktop scene and removes it when reduced motion changes', async () => {
    render(<ProjectsFlightPath projects={siteContent.projects} />)

    expect(await screen.findByTestId('project-flight-scene')).toBeInTheDocument()
    act(() => {
      reducedMotion = true
      mediaListeners.forEach((listener) => listener())
    })
    expect(screen.queryByTestId('project-flight-scene')).not.toBeInTheDocument()
  })

  it('tiers mobile to normal-flow image plates without the pinned WebGL scene', async () => {
    window.innerWidth = 500
    render(<ProjectsFlightPath projects={siteContent.projects} />)

    await waitFor(() => expect(shouldRenderWebGL).toHaveBeenCalled())
    expect(screen.queryByTestId('project-flight-scene')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Select a project' })).toHaveAttribute(
      'data-project-flight-track',
    )
  })
})

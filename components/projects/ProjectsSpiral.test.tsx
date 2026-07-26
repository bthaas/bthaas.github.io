import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { Flip } from 'gsap/Flip'
import { useEffect } from 'react'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { siteContent } from '@/content/site-content'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'

import { ProjectsSpiral } from './ProjectsSpiral'

vi.mock('gsap/Flip', () => ({
  Flip: {
    from: vi.fn(),
    getState: vi.fn(() => ({})),
    killFlipsOf: vi.fn(),
  },
}))

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

  it('server-renders every project as a semantic list and no WebGL canvas', () => {
    const markup = renderToString(<ProjectsSpiral projects={siteContent.projects} />)

    expect(markup).toContain('/projects/courtvision')
    expect(markup).toContain('/projects/beatstream')
    expect(markup).toContain('/projects/vision-bias-steering')
    expect(markup).toContain('React Native')
    expect(markup).toContain('TensorFlow Lite')
    expect(markup).toContain('<ul')
    expect(markup).not.toContain('project-spiral-scene')
  })

  it('keeps three semantic project links in the accessibility-preferred list', () => {
    render(<ProjectsSpiral projects={siteContent.projects} />)

    expect(screen.getAllByTestId('project-spiral-fallback-link')).toHaveLength(3)
    expect(screen.getByRole('link', { name: /Open Beat Stream case study/i })).toHaveAttribute(
      'href',
      '/projects/beatstream',
    )
  })

  it('morphs the same project list into Index view and back to Spiral view', () => {
    const { container } = render(<ProjectsSpiral projects={siteContent.projects} />)
    const projectList = screen.getByRole('list', { name: 'Projects' })
    const projectItems = within(projectList).getAllByRole('listitem', { name: /project/i })
    const spiralButton = screen.getByRole('button', { name: 'Spiral view' })
    const indexButton = screen.getByRole('button', { name: 'Index view' })

    expect(container.querySelector('.project-spiral')).toHaveAttribute(
      'data-project-view',
      'spiral',
    )
    expect(spiralButton).toHaveAttribute('aria-pressed', 'true')
    expect(indexButton).toHaveAttribute('aria-pressed', 'false')
    expect(projectItems).toHaveLength(siteContent.projects.length)

    fireEvent.click(indexButton)

    expect(container.querySelector('.project-spiral')).toHaveAttribute(
      'data-project-view',
      'index',
    )
    expect(indexButton).toHaveAttribute('aria-pressed', 'true')
    expect(spiralButton).toHaveAttribute('aria-pressed', 'false')
    expect(within(projectList).getAllByRole('listitem', { name: /project/i }))
      .toEqual(projectItems)
    siteContent.projects.forEach((project) => {
      const item = screen.getByRole('listitem', { name: `${project.name} project` })
      expect(within(item).getByText(project.description)).toBeInTheDocument()
      project.technologies.forEach((technology) => {
        expect(within(item).getByText(technology)).toBeInTheDocument()
      })
      expect(within(item).getByRole('link', {
        name: `Open ${project.name} case study`,
      })).toHaveAttribute('href', `/projects/${project.id}`)
    })
    expect(Flip.from).toHaveBeenCalledTimes(1)

    fireEvent.click(spiralButton)

    expect(container.querySelector('.project-spiral')).toHaveAttribute(
      'data-project-view',
      'spiral',
    )
    expect(Flip.from).toHaveBeenCalledTimes(2)
  })

  it('defaults to Index and swaps instantly for reduced-motion users', async () => {
    reducedMotion = true
    const { container } = render(<ProjectsSpiral projects={siteContent.projects} />)

    await waitFor(() => {
      expect(container.querySelector('.project-spiral')).toHaveAttribute(
        'data-project-view',
        'index',
      )
    })
    expect(screen.getByRole('button', { name: 'Index view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Spiral view' }))
    expect(container.querySelector('.project-spiral')).toHaveAttribute(
      'data-project-view',
      'spiral',
    )
    expect(Flip.from).not.toHaveBeenCalled()
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

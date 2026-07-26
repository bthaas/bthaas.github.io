'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type {
  ComponentProps,
  CSSProperties,
  ReactNode,
  RefObject,
} from 'react'

import { ATLAS_ROUTE_CHANGE_EVENT } from '@/lib/atlas-events'

type PageTransitionKind = 'portal' | 'standard'
type PageTransitionState = 'entering' | 'exiting' | 'idle'

interface PortalBounds {
  readonly height: number
  readonly left: number
  readonly top: number
  readonly width: number
}

interface PageTransitionRequest {
  readonly bounds?: PortalBounds
  readonly href: string
  readonly image?: string
  readonly kind: PageTransitionKind
  readonly label?: string
}

interface BeginPageTransitionOptions {
  readonly href: string
  readonly portal?: {
    readonly image: string
    readonly label: string
    readonly source: HTMLElement | null
  }
  readonly transition: PageTransitionKind
}

type BeginPageTransition = (options: BeginPageTransitionOptions) => void

const PageTransitionContext = createContext<BeginPageTransition | null>(null)
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function pathsMatch(left: string, right: string) {
  const normalize = (value: string) => {
    const pathname = value.split(/[?#]/, 1)[0]
    return pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  }

  return normalize(left) === normalize(right)
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}

function getPortalBounds(source: HTMLElement | null): PortalBounds | undefined {
  if (!source) return undefined
  const bounds = source.getBoundingClientRect()
  if (bounds.width <= 0 || bounds.height <= 0) return undefined

  return {
    height: bounds.height,
    left: bounds.left,
    top: bounds.top,
    width: bounds.width,
  }
}

export function PageTransitionProvider({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const overlayRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const portalImageRef = useRef<HTMLDivElement>(null)
  const portalFacetsRef = useRef<HTMLSpanElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const exitStartedForRef = useRef<PageTransitionRequest | null>(null)
  const lockedRef = useRef(false)
  const previousPathRef = useRef(pathname)
  const requestRef = useRef<PageTransitionRequest | null>(null)
  const [request, setRequest] = useState<PageTransitionRequest | null>(null)
  const [transitionState, setTransitionState] = useState<PageTransitionState>('idle')

  const finishTransition = useCallback(() => {
    lockedRef.current = false
    exitStartedForRef.current = null
    requestRef.current = null
    if (overlayRef.current) {
      gsap.set(overlayRef.current, {
        display: 'none',
        pointerEvents: 'none',
        visibility: 'hidden',
      })
    }
    setRequest(null)
    setTransitionState('idle')
    document.documentElement.removeAttribute('data-page-transition')
    document.documentElement.removeAttribute('data-page-transition-kind')
  }, [])

  const beginTransition = useCallback<BeginPageTransition>((options) => {
    if (lockedRef.current || pathsMatch(pathname, options.href)) return

    lockedRef.current = true
    if (prefersReducedMotion()) {
      router.push(options.href)
      return
    }

    const nextRequest: PageTransitionRequest = {
      bounds: options.transition === 'portal'
        ? getPortalBounds(options.portal?.source ?? null)
        : undefined,
      href: options.href,
      image: options.portal?.image,
      kind: options.transition,
      label: options.portal?.label,
    }
    requestRef.current = nextRequest
    setRequest(nextRequest)
    setTransitionState('exiting')
  }, [pathname, router])

  useLayoutEffect(() => {
    if (
      transitionState !== 'exiting'
      || !request
      || exitStartedForRef.current === request
    ) return
    exitStartedForRef.current = request

    const overlay = overlayRef.current
    const portal = portalRef.current
    const portalImage = portalImageRef.current
    const portalFacets = portalFacetsRef.current
    const veil = veilRef.current
    if (!overlay || !portal || !portalImage || !portalFacets || !veil) return

    document.documentElement.setAttribute('data-page-transition', 'exiting')
    document.documentElement.setAttribute('data-page-transition-kind', request.kind)
    gsap.set(overlay, { display: 'block', pointerEvents: 'auto', visibility: 'visible' })

    if (request.kind === 'portal') {
      const bounds = request.bounds ?? {
        height: window.innerHeight * 0.48,
        left: window.innerWidth * 0.17,
        top: window.innerHeight * 0.2,
        width: window.innerWidth * 0.66,
      }
      const gatewayDetails = document.querySelectorAll<HTMLElement>([
        '.portfolio-gateway__introduction',
        '.portfolio-gateway__word',
        '.portfolio-gateway__controls',
      ].join(','))
      const gatewayArtwork = document.querySelector<HTMLElement>(
        '.portfolio-gateway__fallback',
      )

      gsap.set(veil, { opacity: 0 })
      gsap.set(portal, {
        borderRadius: '50% / 8%',
        height: bounds.height,
        left: bounds.left,
        opacity: 1,
        scale: 0.96,
        top: bounds.top,
        width: bounds.width,
      })
      gsap.set(portalImage, { scale: 1 })
      gsap.set(portalFacets, { backgroundSize: '8.333% 100%', opacity: 0.68 })

      const timeline = gsap.timeline({
        defaults: { ease: 'power4.inOut' },
        onComplete: () => router.push(request.href),
      })
      timeline
        .to(gatewayDetails, {
          duration: 0.34,
          opacity: 0,
          stagger: 0.035,
          y: -24,
        }, 0)
        .to(gatewayArtwork, {
          duration: 0.62,
          opacity: 0.24,
          scale: 1.12,
        }, 0)
        .to(portal, {
          borderRadius: 0,
          duration: 0.76,
          height: window.innerHeight,
          left: 0,
          scale: 1,
          top: 0,
          width: window.innerWidth,
        }, 0)
        .to(portalImage, {
          duration: 0.76,
          scale: 1.09,
        }, 0)
        .to(portalFacets, {
          backgroundSize: '18% 100%',
          duration: 0.62,
          opacity: 0.12,
        }, 0.08)

      return () => {
        timeline.kill()
      }
    }

    gsap.set(portal, { opacity: 0 })
    gsap.set(veil, { opacity: 0 })
    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => router.push(request.href),
    })
    timeline.to(veil, { duration: 0.24, opacity: 1 })

    return () => {
      timeline.kill()
    }
  }, [request, router, transitionState])

  useLayoutEffect(() => {
    const previousPath = previousPathRef.current
    if (previousPath === pathname) return
    previousPathRef.current = pathname
    window.dispatchEvent(new CustomEvent(ATLAS_ROUTE_CHANGE_EVENT, {
      detail: { pathname },
    }))

    if (prefersReducedMotion()) {
      finishTransition()
      return
    }

    const activeRequest = requestRef.current
    const overlay = overlayRef.current
    const portal = portalRef.current
    const portalImage = portalImageRef.current
    const portalFacets = portalFacetsRef.current
    const veil = veilRef.current
    if (!overlay || !portal || !portalImage || !portalFacets || !veil) {
      finishTransition()
      return
    }

    lockedRef.current = true
    const arrivalRequest = activeRequest ?? {
      href: pathname,
      kind: 'standard' as const,
    }
    requestRef.current = arrivalRequest
    setRequest(arrivalRequest)
    setTransitionState('entering')
    document.documentElement.setAttribute('data-page-transition', 'entering')
    document.documentElement.setAttribute(
      'data-page-transition-kind',
      arrivalRequest.kind,
    )
    gsap.set(overlay, { display: 'block', pointerEvents: 'auto', visibility: 'visible' })

    const main = document.querySelector<HTMLElement>('main')
    if (arrivalRequest.kind === 'portal') {
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: finishTransition,
      })
      timeline
        .to(portalFacets, { duration: 0.26, opacity: 0 }, 0)
        .to(portal, {
          duration: 0.46,
          ease: 'power3.in',
          opacity: 0,
          scale: 1.12,
        }, 0)
      if (main) {
        timeline.fromTo(main, {
          opacity: 0.72,
          scale: 0.945,
          y: 24,
        }, {
          clearProps: 'opacity,transform',
          duration: 0.54,
          opacity: 1,
          scale: 1,
          y: 0,
        }, 0.08)
      }

      return () => {
        timeline.kill()
      }
    }

    gsap.set(portal, { opacity: 0 })
    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: finishTransition,
    })
    timeline.fromTo(veil, { opacity: activeRequest ? 1 : 0.62 }, {
      duration: activeRequest ? 0.34 : 0.42,
      opacity: 0,
    }, 0)
    if (main) {
      timeline.fromTo(main, {
        opacity: 0.84,
        y: 18,
      }, {
        clearProps: 'opacity,transform',
        duration: 0.42,
        opacity: 1,
        y: 0,
      }, 0)
    }

    return () => {
      timeline.kill()
    }
  }, [finishTransition, pathname])

  const overlayStyle = request?.image
    ? {
        '--page-transition-image': `url("${request.image}")`,
      } as CSSProperties
    : undefined

  return (
    <PageTransitionContext.Provider value={beginTransition}>
      {children}
      <div
        aria-hidden="true"
        className="page-transition"
        data-testid="page-transition-overlay"
        data-transition-kind={request?.kind ?? 'standard'}
        data-transition-state={transitionState}
        ref={overlayRef}
        style={overlayStyle}
      >
        <div className="page-transition__veil" ref={veilRef} />
        <div className="page-transition__portal" ref={portalRef}>
          <div className="page-transition__portal-image" ref={portalImageRef} />
          <span className="page-transition__portal-facets" ref={portalFacetsRef} />
          <span className="page-transition__portal-label">
            {request?.kind === 'portal' ? request.label : null}
          </span>
        </div>
      </div>
    </PageTransitionContext.Provider>
  )
}

export interface PortalTransition {
  readonly image: string
  readonly label: string
  readonly sourceRef: RefObject<HTMLElement | null>
}

type TransitionLinkProps = Omit<
  ComponentProps<typeof Link>,
  'href' | 'onNavigate'
> & {
  readonly href: string
  readonly portal?: PortalTransition
  readonly transition?: PageTransitionKind
}

export function TransitionLink({
  children,
  href,
  portal,
  transition = 'standard',
  ...props
}: TransitionLinkProps) {
  const beginTransition = useContext(PageTransitionContext)

  return (
    <Link
      {...props}
      data-transition-kind={transition}
      href={href}
      onNavigate={(event) => {
        if (!beginTransition) return
        event.preventDefault()
        beginTransition({
          href,
          portal: portal
            ? {
                image: portal.image,
                label: portal.label,
                source: portal.sourceRef.current,
              }
            : undefined,
          transition,
        })
      }}
    >
      {children}
    </Link>
  )
}

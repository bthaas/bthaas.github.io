'use client'

import { gsap } from 'gsap'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
const ARRIVAL_WATCHDOG_MS = 900
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const PORTFOLIO_DESTINATIONS = [
  '/experience',
  '/projects',
  '/skills',
  '/contact',
] as const
const UNSPOOL_RIBBON_COUNT = 12
const UNSPOOL_RIBBONS = Array.from(
  { length: UNSPOOL_RIBBON_COUNT },
  (_, index) => index,
)

function getRibbonCenterDistance(index: number) {
  const center = (UNSPOOL_RIBBON_COUNT - 1) / 2
  return Math.abs(index - center) / center
}

function getRibbonDirection(index: number) {
  return index < UNSPOOL_RIBBON_COUNT / 2 ? -1 : 1
}

function getTransitionCategory(request: PageTransitionRequest | null) {
  if (request?.kind !== 'portal' || !request.label) return undefined
  return request.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

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
  const portalApertureRef = useRef<HTMLDivElement>(null)
  const portalImageRef = useRef<HTMLDivElement>(null)
  const portalFacetsRef = useRef<HTMLSpanElement>(null)
  const portalLabelRef = useRef<HTMLSpanElement>(null)
  const portalRibbonsRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const exitStartedForRef = useRef<PageTransitionRequest | null>(null)
  const lockedRef = useRef(false)
  const previousPathRef = useRef(pathname)
  const requestRef = useRef<PageTransitionRequest | null>(null)
  const [request, setRequest] = useState<PageTransitionRequest | null>(null)
  const [transitionState, setTransitionState] = useState<PageTransitionState>('idle')
  const prefetch = router.prefetch

  useEffect(() => {
    if (pathname !== '/') return
    PORTFOLIO_DESTINATIONS.forEach((href) => prefetch(href))
  }, [pathname, prefetch])

  const finishTransition = useCallback(() => {
    lockedRef.current = false
    exitStartedForRef.current = null
    requestRef.current = null
    if (overlayRef.current) {
      overlayRef.current.removeAttribute('data-transition-handoff')
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
    const portalAperture = portalApertureRef.current
    const portalImage = portalImageRef.current
    const portalFacets = portalFacetsRef.current
    const portalLabel = portalLabelRef.current
    const portalRibbons = portalRibbonsRef.current
    const veil = veilRef.current
    if (
      !overlay
      || !portal
      || !portalAperture
      || !portalImage
      || !portalFacets
      || !portalLabel
      || !portalRibbons
      || !veil
    ) return

    document.documentElement.setAttribute('data-page-transition', 'exiting')
    document.documentElement.setAttribute('data-page-transition-kind', request.kind)
    gsap.set(overlay, { display: 'block', pointerEvents: 'auto', visibility: 'visible' })

    if (request.kind === 'portal') {
      overlay.setAttribute('data-transition-handoff', 'pending')
      const viewportHeight = Math.max(window.innerHeight, 1)
      const viewportWidth = Math.max(window.innerWidth, 1)
      const bounds = request.bounds ?? {
        height: viewportHeight * 0.48,
        left: viewportWidth * 0.17,
        top: viewportHeight * 0.2,
        width: viewportWidth * 0.66,
      }
      const gatewayDetails = document.querySelectorAll<HTMLElement>([
        '.portfolio-gateway__introduction',
        '.portfolio-gateway__word',
        '.portfolio-gateway__controls',
      ].join(','))
      const gatewayArtwork = document.querySelector<HTMLElement>(
        '.portfolio-gateway__fallback',
      )
      const ribbons = Array.from(portalRibbons.querySelectorAll<HTMLElement>(
        '[data-page-transition-ribbon]',
      ))

      gsap.set(veil, { opacity: 0 })
      gsap.set(portal, {
        borderRadius: '50% / 8%',
        height: viewportHeight,
        left: 0,
        opacity: 1,
        scaleX: bounds.width / viewportWidth,
        scaleY: bounds.height / viewportHeight,
        top: 0,
        transformOrigin: '0 0',
        width: viewportWidth,
        x: bounds.left,
        y: bounds.top,
      })
      gsap.set(portalImage, {
        opacity: 1,
        scale: 1,
      })
      gsap.set(portalAperture, { opacity: 0, scale: 0.24 })
      gsap.set(portalFacets, { backgroundSize: '8.333% 100%', opacity: 0.68 })
      gsap.set(portalLabel, { opacity: 1, scale: 1, y: 0 })
      gsap.set(portalRibbons, { opacity: 1 })
      gsap.set(ribbons, {
        opacity: 1,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        scaleX: 1.015,
        scaleY: 1,
        xPercent: 0,
        yPercent: 0,
        z: 0,
      })

      const timeline = gsap.timeline({
        defaults: { ease: 'power4.inOut' },
      })
      timeline
        .to(gatewayDetails, {
          duration: 0.22,
          opacity: 0,
          stagger: 0.025,
          y: -18,
        }, 0)
        .to(gatewayArtwork, {
          duration: 0.38,
          opacity: 0.28,
          scale: 1.06,
        }, 0)
        .to(portal, {
          borderRadius: 0,
          duration: 0.38,
          ease: 'power3.inOut',
          scaleX: 1,
          scaleY: 1,
          x: 0,
          y: 0,
        }, 0)
        .to(portalImage, {
          duration: 0.56,
          ease: 'power2.inOut',
          opacity: 0.42,
          scale: 1.14,
        }, 0)
        .to(portalFacets, {
          duration: 0.26,
          opacity: 0,
        }, 0.04)
        .to(portalLabel, {
          duration: 0.24,
          ease: 'power3.in',
          opacity: 0,
          scale: 0.92,
          y: -14,
        }, 0.02)
        .to(portalAperture, {
          duration: 0.46,
          ease: 'power2.inOut',
          opacity: 0.66,
          scale: 1,
        }, 0.1)
        .to(ribbons, {
          duration: 0.56,
          ease: 'power3.inOut',
          rotateY: (index: number) => (
            getRibbonDirection(index) * (22 + getRibbonCenterDistance(index) * 30)
          ),
          rotateZ: (index: number) => (
            getRibbonDirection(index) * (1.5 + getRibbonCenterDistance(index) * 4)
          ),
          scaleY: 1.06,
          stagger: { amount: 0.1, from: 'center' },
          xPercent: (index: number) => (
            getRibbonDirection(index) * (62 + getRibbonCenterDistance(index) * 94)
          ),
          z: (index: number) => 300 + (1 - getRibbonCenterDistance(index)) * 380,
        }, 0.08)
        .to(portalImage, {
          duration: 0.72,
          ease: 'sine.inOut',
          opacity: 0.34,
          repeat: -1,
          scale: 1.18,
          yoyo: true,
        }, 0.52)
        .to(portalAperture, {
          duration: 0.8,
          ease: 'sine.inOut',
          opacity: 0.5,
          repeat: -1,
          scale: 1.08,
          yoyo: true,
        }, 0.52)

      overlay.setAttribute('data-transition-handoff', 'requested')
      router.push(request.href)

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
    const portalAperture = portalApertureRef.current
    const portalImage = portalImageRef.current
    const portalFacets = portalFacetsRef.current
    const portalRibbons = portalRibbonsRef.current
    const veil = veilRef.current
    if (
      !overlay
      || !portal
      || !portalAperture
      || !portalImage
      || !portalFacets
      || !portalRibbons
      || !veil
    ) {
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
      const ribbons = Array.from(portalRibbons.querySelectorAll<HTMLElement>(
        '[data-page-transition-ribbon]',
      ))
      let watchdog: number | undefined
      const completeArrival = () => {
        if (watchdog !== undefined) window.clearTimeout(watchdog)
        finishTransition()
      }
      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: completeArrival,
      })
      timeline
        .to(ribbons, {
          duration: 0.36,
          ease: 'power3.in',
          opacity: 0,
          rotateY: (index: number) => getRibbonDirection(index) * 82,
          stagger: { amount: 0.06, from: 'center' },
          xPercent: (index: number) => (
            getRibbonDirection(index) * (154 + getRibbonCenterDistance(index) * 90)
          ),
          z: (index: number) => 760 + (1 - getRibbonCenterDistance(index)) * 360,
        }, 0)
        .to(portalAperture, {
          duration: 0.28,
          ease: 'power2.in',
          opacity: 0,
          scale: 1.5,
        }, 0)
        .to(portalFacets, { duration: 0.16, opacity: 0 }, 0)
        .to(portalImage, {
          duration: 0.34,
          ease: 'power3.in',
          opacity: 0,
          scale: 1.3,
        }, 0)
        .to(portal, {
          duration: 0.38,
          opacity: 0,
          scaleX: 1,
          scaleY: 1,
          x: 0,
          y: 0,
        }, 0)
      if (main) {
        timeline.fromTo(main, {
          opacity: 0.76,
          scale: 0.975,
          y: 16,
        }, {
          clearProps: 'opacity,transform',
          duration: 0.44,
          opacity: 1,
          scale: 1,
          y: 0,
        }, 0)
      }
      watchdog = window.setTimeout(() => {
        timeline.kill()
        finishTransition()
      }, ARRIVAL_WATCHDOG_MS)

      return () => {
        if (watchdog !== undefined) window.clearTimeout(watchdog)
        timeline.kill()
      }
    }

    gsap.set(portal, { opacity: 0 })
    let watchdog: number | undefined
    const completeArrival = () => {
      if (watchdog !== undefined) window.clearTimeout(watchdog)
      finishTransition()
    }
    const timeline = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: completeArrival,
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
    watchdog = window.setTimeout(() => {
      timeline.kill()
      finishTransition()
    }, ARRIVAL_WATCHDOG_MS)

    return () => {
      if (watchdog !== undefined) window.clearTimeout(watchdog)
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
        data-transition-category={getTransitionCategory(request)}
        data-transition-kind={request?.kind ?? 'standard'}
        data-transition-state={transitionState}
        ref={overlayRef}
        style={overlayStyle}
      >
        <div className="page-transition__veil" ref={veilRef} />
        <div className="page-transition__portal" ref={portalRef}>
          <div className="page-transition__portal-image" ref={portalImageRef} />
          <div className="page-transition__portal-aperture" ref={portalApertureRef} />
          <div className="page-transition__portal-ribbons" ref={portalRibbonsRef}>
            {UNSPOOL_RIBBONS.map((index) => {
              const position = `${(index / (UNSPOOL_RIBBON_COUNT - 1)) * 100}%`
              const style = {
                '--page-transition-ribbon-index': index,
                '--page-transition-ribbon-position': position,
              } as CSSProperties

              return (
                <span
                  className="page-transition__portal-ribbon"
                  data-page-transition-ribbon
                  data-testid="page-transition-ribbon"
                  key={index}
                  style={style}
                />
              )
            })}
          </div>
          <span className="page-transition__portal-facets" ref={portalFacetsRef} />
          <span className="page-transition__portal-label" ref={portalLabelRef}>
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

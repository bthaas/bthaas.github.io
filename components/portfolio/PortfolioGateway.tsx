'use client'

import dynamic from 'next/dynamic'
import { Component, useCallback, useEffect, useRef, useState } from 'react'

import {
  WEBGL_ACTIVATED_ATTRIBUTE,
  WEBGL_ACTIVATION_EVENT,
} from '@/components/motion/WebGLActivationGate'
import { detectWebGLProfile, shouldRenderWebGL } from '@/lib/client-capabilities'
import {
  GATEWAY_CATEGORIES,
  getGatewayRotation,
  getWrappedGatewayIndex,
} from '@/lib/portfolio-gateway'

const PortfolioGatewayScene = dynamic(
  () => import('../scenes/AtlasWebGLScenes').then((module) => module.PortfolioGatewayScene),
  { ssr: false },
)

interface GatewayBoundaryState {
  readonly failed: boolean
}

class GatewayBoundary extends Component<React.PropsWithChildren, GatewayBoundaryState> {
  state: GatewayBoundaryState = { failed: false }

  static getDerivedStateFromError(): GatewayBoundaryState {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export function PortfolioGateway() {
  const rootRef = useRef<HTMLElement>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [step, setStep] = useState(0)
  const [canvasReady, setCanvasReady] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isConstrained, setIsConstrained] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const activeIndex = getWrappedGatewayIndex(step)
  const activeCategory = GATEWAY_CATEGORIES[activeIndex]
  const handleReady = useCallback(() => setCanvasReady(true), [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: '-10% 0px' },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      const profile = detectWebGLProfile()
      const eligible = shouldRenderWebGL({
        reducedMotion: reducedMotion.matches,
        webGLAvailable: profile.available,
        width: window.innerWidth,
      })
      setIsConstrained(profile.constrained || window.innerWidth < 768)
      setShowStats(new URLSearchParams(window.location.search).get('stats') === '1')
      setMounted(
        eligible
        && isActive
        && document.documentElement.hasAttribute(WEBGL_ACTIVATED_ATTRIBUTE),
      )
      if (!eligible || !isActive) setCanvasReady(false)
    }

    update()
    reducedMotion.addEventListener('change', update)
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener(WEBGL_ACTIVATION_EVENT, update)
    return () => {
      reducedMotion.removeEventListener('change', update)
      window.removeEventListener('resize', update)
      window.removeEventListener(WEBGL_ACTIVATION_EVENT, update)
    }
  }, [isActive])

  const selectPrevious = useCallback(() => setStep((current) => current - 1), [])
  const selectNext = useCallback(() => setStep((current) => current + 1), [])

  return (
    <section
      ref={rootRef}
      className="portfolio-gateway"
      id="portfolio-gateway"
      aria-labelledby="portfolio-gateway-title"
    >
      <h2 className="portfolio-gateway__sr-only" id="portfolio-gateway-title">
        Explore the portfolio
      </h2>
      <p className="portfolio-gateway__introduction">
        Brett Haas is an engineer, researcher, and builder.
      </p>
      <p className="portfolio-gateway__word" aria-hidden="true">PORTFOLIO</p>
      <p className="portfolio-gateway__sr-only" role="status" aria-live="polite">
        {activeCategory.label} category selected
      </p>

      <div
        className="portfolio-gateway__carousel"
        role="region"
        aria-label="Portfolio category carousel"
        aria-roledescription="carousel"
        data-active-index={activeIndex}
        data-canvas-ready={canvasReady ? '' : undefined}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            selectPrevious()
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault()
            selectNext()
          }
        }}
        tabIndex={0}
      >
        <div
          className="portfolio-gateway__visual"
          aria-hidden="true"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            pointerRef.current.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
            pointerRef.current.y = -(((event.clientY - bounds.top) / bounds.height) * 2 - 1)
          }}
          onPointerLeave={() => {
            pointerRef.current.x = 0
            pointerRef.current.y = 0
          }}
        >
          <div className="portfolio-gateway__fallback">
            <div
              className="portfolio-gateway__fallback-ring"
              style={{ transform: `translateZ(-19rem) rotateY(${getGatewayRotation(step)}deg)` }}
            >
              {GATEWAY_CATEGORIES.map((category, index) => (
                <div
                  className="portfolio-gateway__fallback-face"
                  style={{ transform: `rotateY(${index * 120}deg) translateZ(19rem)` }}
                  key={category.id}
                >
                  <img
                    src={category.image}
                    alt=""
                    width="960"
                    height="640"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <div className="portfolio-gateway__fallback-reflection">
              <img
                src={activeCategory.image}
                alt=""
                width="960"
                height="640"
                decoding="async"
                loading="lazy"
              />
            </div>
          </div>
          {mounted && (
            <div className="portfolio-gateway__canvas">
              <GatewayBoundary>
                <PortfolioGatewayScene
                  activeIndex={activeIndex}
                  isConstrained={isConstrained}
                  pointerRef={pointerRef}
                  rotationStep={step}
                  showStats={showStats}
                  onReady={handleReady}
                />
              </GatewayBoundary>
            </div>
          )}
          <p className="portfolio-gateway__face-label">{activeCategory.label}</p>
        </div>

        <div className="portfolio-gateway__controls">
          <a
            className="portfolio-gateway__active-link"
            href={activeCategory.href}
            aria-label={`Open ${activeCategory.label}`}
          >
            <span className="portfolio-gateway__thumbnail" aria-hidden="true">
              <img
                src={activeCategory.image}
                alt=""
                width="96"
                height="96"
                decoding="async"
                loading="lazy"
              />
            </span>
            <span>{activeCategory.label}</span>
          </a>
          <div className="portfolio-gateway__arrows">
            <button type="button" aria-label="Previous category" onClick={selectPrevious}>←</button>
            <button type="button" aria-label="Next category" onClick={selectNext}>→</button>
          </div>
          <span className="portfolio-gateway__orbit" aria-hidden="true">
            <span />
          </span>
        </div>
      </div>
    </section>
  )
}

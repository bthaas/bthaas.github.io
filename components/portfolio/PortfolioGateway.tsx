'use client'

import { useCallback, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

import {
  GATEWAY_CATEGORIES,
  GATEWAY_CYLINDER_SEGMENTS,
  getGatewayDragRotation,
  getGatewayRotation,
  getGatewayStepDeltaFromDrag,
  getWrappedGatewayIndex,
} from '@/lib/portfolio-gateway'

interface GatewayDragState {
  deltaX: number
  pointerId: number | null
  startX: number
  width: number
}

function GatewayCylinderSlices() {
  return GATEWAY_CYLINDER_SEGMENTS.map((segment) => {
    const category = GATEWAY_CATEGORIES[segment.categoryIndex]
    const style = {
      '--gateway-segment-angle': `${segment.angle}deg`,
      '--gateway-segment-image': `url("${category.image}")`,
      '--gateway-segment-position': `${segment.imagePosition}%`,
    } as CSSProperties

    return (
      <span
        className="portfolio-gateway__fallback-slice"
        data-gateway-category={segment.categoryId}
        key={segment.id}
        style={style}
      />
    )
  })
}

export function PortfolioGateway() {
  const dragRef = useRef<GatewayDragState>({
    deltaX: 0,
    pointerId: null,
    startX: 0,
    width: 1,
  })
  const [step, setStep] = useState(0)
  const [dragRotation, setDragRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const activeIndex = getWrappedGatewayIndex(step)
  const activeCategory = GATEWAY_CATEGORIES[activeIndex]
  const carouselRotation = getGatewayRotation(step) + dragRotation

  const selectPrevious = useCallback(() => setStep((current) => current - 1), [])
  const selectNext = useCallback(() => setStep((current) => current + 1), [])
  const finishDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    shouldSelectCategory: boolean,
  ) => {
    const drag = dragRef.current
    if (drag.pointerId !== event.pointerId) return

    if (shouldSelectCategory) {
      const stepDelta = getGatewayStepDeltaFromDrag(drag.deltaX, drag.width)
      if (stepDelta !== 0) setStep((current) => current + stepDelta)
    }
    drag.pointerId = null
    drag.deltaX = 0
    setDragRotation(0)
    setDragging(false)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Native pointer cancellation may release capture before React is notified.
    }
  }

  return (
    <section
      className="portfolio-gateway"
      id="portfolio-gateway"
      aria-labelledby="portfolio-gateway-title"
    >
      <h2 className="portfolio-gateway__sr-only" id="portfolio-gateway-title">
        Explore the portfolio
      </h2>
      <p className="portfolio-gateway__introduction">
        Engineer · Researcher · Builder
      </p>
      <p className="portfolio-gateway__word" aria-hidden="true">BRETT HAAS</p>
      <p className="portfolio-gateway__sr-only" id="portfolio-gateway-instructions">
        Drag horizontally over the artwork or use the left and right arrow keys to select a category.
      </p>
      <p className="portfolio-gateway__sr-only" role="status" aria-live="polite">
        {activeCategory.label} category selected
      </p>

      <div
        className="portfolio-gateway__carousel"
        role="region"
        aria-label="Portfolio category carousel"
        aria-roledescription="carousel"
        aria-describedby="portfolio-gateway-instructions"
        data-active-index={activeIndex}
        data-dragging={dragging ? 'true' : 'false'}
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
          data-testid="portfolio-gateway-drag-surface"
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            if (event.target instanceof Element && event.target.closest('a')) return
            const bounds = event.currentTarget.getBoundingClientRect()
            dragRef.current = {
              deltaX: 0,
              pointerId: event.pointerId,
              startX: event.clientX,
              width: bounds.width,
            }
            setDragging(true)
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current
            if (drag.pointerId !== event.pointerId) return
            drag.deltaX = event.clientX - drag.startX
            setDragRotation(getGatewayDragRotation(drag.deltaX, drag.width))
          }}
          onPointerCancel={(event) => finishDrag(event, false)}
          onPointerUp={(event) => finishDrag(event, true)}
        >
          <div className="portfolio-gateway__ground-shadow" aria-hidden="true" />
          <div className="portfolio-gateway__fallback" aria-hidden="true">
            <div
              className="portfolio-gateway__fallback-ring"
              style={{
                transform: `translateZ(calc(-1 * var(--gateway-cylinder-radius))) rotateY(${carouselRotation}deg)`,
              }}
            >
              <GatewayCylinderSlices />
            </div>
          </div>
          <a
            className="portfolio-gateway__face-label"
            href={activeCategory.href}
            aria-label={`Open ${activeCategory.label} screen`}
          >
            {activeCategory.label}
          </a>
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

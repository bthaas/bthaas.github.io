'use client'

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import {
  getHeroLiquidFrame,
  getTextureCoverScale,
} from '@/lib/atlas-motion/hero-overdrive'

import {
  liquidPlaneFragmentShader,
  liquidPlaneVertexShader,
} from './liquid-plane-shader'

interface HeroLiquidSceneProps {
  readonly active: boolean
  readonly isConstrained: boolean
  readonly onReady: () => void
}

interface ScrollDetail {
  readonly velocity?: number
}

function LiquidSurface({ active, onReady }: Pick<HeroLiquidSceneProps, 'active' | 'onReady'>) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const texture = useLoader(THREE.TextureLoader, '/icarus-atlas/hero-flight-1600.avif')
  const { gl, invalidate, viewport } = useThree()
  const velocityRef = useRef(0)
  const pointerTarget = useMemo(() => new THREE.Vector2(0.5, 0.5), [])
  const pointerCurrent = useMemo(() => new THREE.Vector2(0.5, 0.5), [])
  const pointerInside = useRef(false)
  const interactionUntil = useRef(0)
  const liquidFrame = useMemo(() => ({ bulge: 0, uvShift: 0 }), [])
  const cover = useMemo(() => new THREE.Vector2(1, 1), [])
  const uniforms = useMemo(() => ({
    uAspect: { value: 1 },
    uBulge: { value: 0 },
    uCornerRadius: { value: 0 },
    uCover: { value: cover },
    uPointer: { value: pointerCurrent },
    uPointerStrength: { value: 0 },
    uSkew: { value: 0 },
    uTexture: { value: texture },
    uTime: { value: 0 },
    uUvShift: { value: 0 },
  }), [cover, pointerCurrent, texture])

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    texture.needsUpdate = true
    onReady()
    invalidate()
  }, [gl, invalidate, onReady, texture])

  useEffect(() => {
    invalidate()
  }, [active, invalidate])

  useEffect(() => {
    getTextureCoverScale(1600 / 1130, viewport.width / viewport.height, cover)
    invalidate()
  }, [cover, invalidate, viewport.height, viewport.width])

  useEffect(() => {
    const handleScroll = (event: Event) => {
      const velocity = (event as CustomEvent<ScrollDetail>).detail?.velocity
      if (!active || typeof velocity !== 'number') return
      velocityRef.current = velocity
      interactionUntil.current = performance.now() + 520
      invalidate()
    }
    const handlePointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const bounds = gl.domElement.parentElement?.getBoundingClientRect()
      if (!bounds || bounds.width === 0 || bounds.height === 0) return
      const x = (event.clientX - bounds.left) / bounds.width
      const y = 1 - (event.clientY - bounds.top) / bounds.height
      pointerInside.current = active && x >= 0 && x <= 1 && y >= 0 && y <= 1
      if (pointerInside.current) pointerTarget.set(x, y)
      interactionUntil.current = performance.now() + (pointerInside.current ? 900 : 360)
      invalidate()
    }
    window.addEventListener('atlas:scroll', handleScroll)
    window.addEventListener('pointermove', handlePointer, { passive: true })
    return () => {
      window.removeEventListener('atlas:scroll', handleScroll)
      window.removeEventListener('pointermove', handlePointer)
    }
  }, [active, gl, invalidate, pointerTarget])

  useFrame(({ clock }, delta) => {
    const material = materialRef.current
    if (!material) return
    const frame = getHeroLiquidFrame(velocityRef.current, liquidFrame)
    material.uniforms.uAspect.value = viewport.width / viewport.height
    pointerCurrent.lerp(pointerTarget, 1 - Math.exp(-8 * delta))
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uBulge.value = THREE.MathUtils.damp(
      material.uniforms.uBulge.value,
      frame.bulge,
      8,
      delta,
    )
    material.uniforms.uUvShift.value = THREE.MathUtils.damp(
      material.uniforms.uUvShift.value,
      frame.uvShift,
      8,
      delta,
    )
    material.uniforms.uPointerStrength.value = THREE.MathUtils.damp(
      material.uniforms.uPointerStrength.value,
      pointerInside.current ? 1 : 0,
      5,
      delta,
    )
    velocityRef.current *= Math.exp(-5 * delta)
    if (active && (
      performance.now() < interactionUntil.current
      || Math.abs(material.uniforms.uBulge.value) > 0.0001
      || material.uniforms.uPointerStrength.value > 0.005
    )) invalidate()
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 48, 32]} />
      <shaderMaterial
        ref={materialRef}
        fragmentShader={liquidPlaneFragmentShader}
        transparent
        uniforms={uniforms}
        vertexShader={liquidPlaneVertexShader}
      />
    </mesh>
  )
}

export function HeroLiquidScene({ active, isConstrained, onReady }: HeroLiquidSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2], zoom: 100 }}
      dpr={isConstrained ? 1 : [1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: !isConstrained, powerPreference: 'high-performance' }}
      orthographic
      className="hero-liquid-canvas"
    >
      <LiquidSurface active={active} onReady={onReady} />
    </Canvas>
  )
}

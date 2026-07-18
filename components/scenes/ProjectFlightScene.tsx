'use client'

import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type {
  ProjectFlightMotionState,
  ProjectPlaneLayout,
} from '@/components/projects/project-flight-types'
import { getTextureCoverScale } from '@/lib/atlas-motion/hero-overdrive'
import { getProjectFlightFrame } from '@/lib/atlas-motion/project-flight-path'

import {
  liquidPlaneFragmentShader,
  liquidPlaneVertexShader,
} from './liquid-plane-shader'

interface ProjectFlightSceneProps {
  readonly active: boolean
  readonly layoutRef: React.RefObject<ProjectPlaneLayout[]>
  readonly motionRef: React.RefObject<ProjectFlightMotionState>
  readonly onReady: () => void
}

const textureSources = [
  '/icarus-atlas/project-courtvision-1200.avif',
  '/icarus-atlas/project-beatstream-1200.avif',
  '/icarus-atlas/project-vision-bias-steering-1200.avif',
]

function ProjectSurfaces({
  active,
  layoutRef,
  motionRef,
  onReady,
}: ProjectFlightSceneProps) {
  const textures = useLoader(THREE.TextureLoader, textureSources)
  const { gl, invalidate, size, viewport } = useThree()
  const interactionUntil = useRef(0)
  const flightFrame = useMemo(() => ({ bend: 0, skewDegrees: 0, uvShift: 0 }), [])
  const materialRefs = useRef<Array<THREE.ShaderMaterial | null>>([])
  const meshRefs = useRef<Array<THREE.Mesh | null>>([])
  const covers = useMemo(
    () => textureSources.map(() => new THREE.Vector2(1, 1)),
    [],
  )
  const pointer = useMemo(() => new THREE.Vector2(0.5, 0.5), [])
  const uniforms = useMemo(
    () => textures.map((texture, index) => ({
      uAspect: { value: 1 },
      uBulge: { value: 0 },
      uCornerRadius: { value: 0 },
      uCover: { value: covers[index] },
      uPointer: { value: pointer },
      uPointerStrength: { value: 0 },
      uSkew: { value: 0 },
      uTexture: { value: texture },
      uTime: { value: 0 },
      uUvShift: { value: 0 },
    })),
    [covers, pointer, textures],
  )

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = anisotropy
      texture.needsUpdate = true
    })
    const track = gl.domElement.closest<HTMLElement>('[data-project-flight-track]')
    const surfaces = track
      ? Array.from(track.querySelectorAll<HTMLElement>('[data-project-plane]'))
      : []
    const measure = () => {
      if (!track || surfaces.length !== textureSources.length) return false
      layoutRef.current = surfaces.map((surface, index) => {
        let left = 0
        let top = 0
        let current: HTMLElement | null = surface
        while (current && current !== track) {
          left += current.offsetLeft
          top += current.offsetTop
          current = current.offsetParent as HTMLElement | null
        }
        const layout = {
          aspect: Number(surface.dataset.projectPlaneAspect ?? 1),
          height: surface.offsetHeight,
          left,
          top,
          width: surface.offsetWidth,
        }
        getTextureCoverScale(layout.aspect, layout.width / layout.height, covers[index])
        return layout
      })
      invalidate()
      return true
    }
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(measure)
    if (track) observer?.observe(track)
    surfaces.forEach((surface) => observer?.observe(surface))
    if (measure()) onReady()
    invalidate()
    return () => observer?.disconnect()
  }, [gl, invalidate, layoutRef, onReady, textures])

  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (!active) return
      const velocity = (event as CustomEvent<{ velocity?: number }>).detail?.velocity
      if (typeof velocity !== 'number') return
      motionRef.current.velocity = velocity
      interactionUntil.current = performance.now() + 520
      invalidate()
    }
    const handleLayout = () => invalidate()
    window.addEventListener('atlas:scroll', handleScroll)
    window.addEventListener('atlas:project-flight-layout', handleLayout)
    return () => {
      window.removeEventListener('atlas:scroll', handleScroll)
      window.removeEventListener('atlas:project-flight-layout', handleLayout)
    }
  }, [active, invalidate, motionRef])

  useFrame(({ clock }, delta) => {
    const layouts = layoutRef.current
    const frame = getProjectFlightFrame(motionRef.current.velocity, flightFrame)
    const unitX = viewport.width / Math.max(1, size.width)
    const unitY = viewport.height / Math.max(1, size.height)

    for (let index = 0; index < layouts.length; index += 1) {
      const layout = layouts[index]
      const mesh = meshRefs.current[index]
      const material = materialRefs.current[index]
      if (!layout || !mesh || !material) continue

      mesh.position.set(
        (layout.left + layout.width / 2 - size.width / 2) * unitX,
        (size.height / 2 - layout.top - layout.height / 2) * unitY,
        0,
      )
      mesh.scale.set(layout.width * unitX, layout.height * unitY, 1)
      material.uniforms.uTime.value = clock.elapsedTime
      material.uniforms.uAspect.value = layout.width / layout.height
      material.uniforms.uCornerRadius.value = Math.min(0.055, 26 / layout.height)
      material.uniforms.uBulge.value = THREE.MathUtils.damp(
        material.uniforms.uBulge.value,
        frame.bend,
        8,
        delta,
      )
      material.uniforms.uUvShift.value = THREE.MathUtils.damp(
        material.uniforms.uUvShift.value,
        frame.uvShift,
        8,
        delta,
      )
      material.uniforms.uSkew.value = THREE.MathUtils.damp(
        material.uniforms.uSkew.value,
        THREE.MathUtils.degToRad(frame.skewDegrees),
        8,
        delta,
      )
    }

    motionRef.current.velocity *= Math.exp(-5 * delta)
    if (active && (
      performance.now() < interactionUntil.current
      || Math.abs(motionRef.current.velocity) > 0.05
    )) invalidate()
  })

  return (
    <>
      {uniforms.map((surfaceUniforms, index) => (
        <mesh
          key={textureSources[index]}
          ref={(mesh) => {
            meshRefs.current[index] = mesh
          }}
        >
          <planeGeometry args={[1, 1, 40, 28]} />
          <shaderMaterial
            ref={(material) => {
              materialRefs.current[index] = material
            }}
            fragmentShader={liquidPlaneFragmentShader}
            depthTest={false}
            depthWrite={false}
            transparent
            uniforms={surfaceUniforms}
            vertexShader={liquidPlaneVertexShader}
          />
        </mesh>
      ))}
    </>
  )
}

export function ProjectFlightScene(props: ProjectFlightSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2], zoom: 100 }}
      dpr={1}
      frameloop="demand"
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      orthographic
      className="project-flight-canvas"
    >
      <ProjectSurfaces {...props} />
    </Canvas>
  )
}

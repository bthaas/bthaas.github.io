'use client'

import { useGLTF, useTexture } from '@react-three/drei'
import { Stats } from '@react-three/drei/core/Stats.js'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { ProjectSpiralMotionState } from '@/components/projects/project-spiral-types'
import {
  getProjectSpiralFrame,
  PROJECT_SPIRAL_SLOT_ORDER,
} from '@/lib/project-spiral'

const CARD_COUNT = 9
const MODEL_PATH = '/models/project-spiral.glb'
const TEXTURE_SOURCES = [
  '/icarus-atlas/project-courtvision-1200.avif',
  '/icarus-atlas/project-beatstream-1200.avif',
  '/icarus-atlas/project-vision-bias-steering-1200.avif',
] as const

interface ProjectSpiralSceneProps {
  readonly active: boolean
  readonly isMobile: boolean
  readonly motionRef: React.RefObject<ProjectSpiralMotionState>
  readonly onReady: () => void
  readonly showStats: boolean
}

interface CardGeometry {
  readonly geometry: THREE.BufferGeometry
  readonly width: number
}

function ProjectSpiralCards({
  active,
  isMobile,
  motionRef,
  onReady,
}: ProjectSpiralSceneProps) {
  const gltf = useGLTF(MODEL_PATH, '/draco/')
  const textures = useTexture([...TEXTURE_SOURCES])
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<Array<THREE.Mesh | null>>([])
  const readyRef = useRef(false)
  const renderedPhase = useRef(0)
  const renderedVelocity = useRef(0)
  const { gl, invalidate, viewport } = useThree()

  const cards = useMemo<CardGeometry[]>(() => {
    const clonedScene = gltf.scene.clone(true)
    return Array.from({ length: CARD_COUNT }, (_, index) => {
      const name = `project_card_${String(index + 1).padStart(2, '0')}`
      const object = clonedScene.getObjectByName(name)
      if (!(object instanceof THREE.Mesh)) {
        throw new Error(`Missing project spiral node: ${name}`)
      }
      const geometry = object.geometry
      geometry.computeBoundingBox()
      const bounds = geometry.boundingBox
      return {
        geometry,
        width: bounds ? bounds.max.x - bounds.min.x : 1,
      }
    })
  }, [gltf.scene])

  const materials = useMemo(
    () => Array.from({ length: CARD_COUNT }, (_, index) => new THREE.MeshBasicMaterial({
      color: 0xffffff,
      depthTest: true,
      depthWrite: true,
      map: textures[PROJECT_SPIRAL_SLOT_ORDER[index] % textures.length],
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    })),
    [textures],
  )

  useEffect(() => {
    const anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    textures.forEach((texture) => {
      texture.anisotropy = anisotropy
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    })
    return () => materials.forEach((material) => material.dispose())
  }, [gl, materials, textures])

  useEffect(() => {
    if (!active || !isMobile) return
    let animationFrame = 0
    let lastRender = 0
    const renderAtThirtyFps = (time: number) => {
      if (time - lastRender >= 1000 / 30) {
        lastRender = time
        invalidate()
      }
      animationFrame = requestAnimationFrame(renderAtThirtyFps)
    }
    animationFrame = requestAnimationFrame(renderAtThirtyFps)
    return () => cancelAnimationFrame(animationFrame)
  }, [active, invalidate, isMobile])

  useFrame(({ clock }, delta) => {
    if (!active) return
    renderedPhase.current = THREE.MathUtils.damp(
      renderedPhase.current,
      motionRef.current.phase,
      7.5,
      delta,
    )
    renderedVelocity.current = THREE.MathUtils.damp(
      renderedVelocity.current,
      motionRef.current.velocity,
      5.5,
      delta,
    )

    const horizontalRadius = Math.min(viewport.width * 0.23, 4.4)
    const verticalPitch = viewport.height * 0.44
    const targetCardWidth = Math.min(viewport.width * 0.26, 4.45)
    for (let index = 0; index < CARD_COUNT; index += 1) {
      const mesh = meshRefs.current[index]
      if (!mesh) continue
      const frame = getProjectSpiralFrame({
        phase: renderedPhase.current,
        slotCount: CARD_COUNT,
        slotIndex: index,
        velocity: renderedVelocity.current,
      })
      const idleLift = Math.sin(clock.elapsedTime * 0.55 + index * 1.7) * 0.035
      const roll = Math.sin(index * 2.31) * 0.045
      const scale = targetCardWidth / cards[index].width * frame.scale
      const depthProgress = (frame.depth + 1) / 2

      mesh.position.set(
        frame.x * horizontalRadius,
        frame.y * verticalPitch + idleLift,
        frame.depth * 1.55,
      )
      mesh.rotation.set(
        frame.velocitySkew * 0.34,
        frame.rotationY,
        roll + frame.velocitySkew,
      )
      mesh.scale.setScalar(scale)
      mesh.renderOrder = frame.zIndex
      const material = materials[index]
      material.opacity = frame.opacity
      material.color.setScalar(0.58 + depthProgress * 0.42)
    }

    const group = groupRef.current
    if (group) {
      group.rotation.x = THREE.MathUtils.damp(
        group.rotation.x,
        -motionRef.current.pointerY * 0.035,
        4,
        delta,
      )
      group.rotation.y = THREE.MathUtils.damp(
        group.rotation.y,
        motionRef.current.pointerX * 0.05,
        4,
        delta,
      )
    }
    if (!readyRef.current) {
      readyRef.current = true
      onReady()
    }
    motionRef.current.velocity *= Math.exp(-4.5 * delta)
  })

  return (
    <group ref={groupRef}>
      {cards.map((card, index) => (
        <mesh
          geometry={card.geometry}
          key={`project-spiral-card-${index + 1}`}
          material={materials[index]}
          ref={(mesh) => {
            meshRefs.current[index] = mesh
          }}
        />
      ))}
    </group>
  )
}

export function ProjectSpiralScene(props: ProjectSpiralSceneProps) {
  return (
    <Canvas
      camera={{ fov: 44, near: 0.1, far: 30, position: [0, 0, 9.5] }}
      className="project-spiral-canvas"
      dpr={props.isMobile ? 1 : [1, 1.5]}
      frameloop={props.isMobile ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
    >
      <ProjectSpiralCards {...props} />
      {props.showStats && <Stats className="project-spiral-stats" />}
    </Canvas>
  )
}

useGLTF.preload(MODEL_PATH, '/draco/')
useTexture.preload([...TEXTURE_SOURCES])

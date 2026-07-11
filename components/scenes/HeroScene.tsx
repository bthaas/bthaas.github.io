'use client'

import { DepthOfField, EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { createWingLayout } from '@/lib/wing-layout'

interface HeroSceneProps {
  readonly fractureProgressRef: React.MutableRefObject<number>
  readonly showStats?: boolean
}

function createFeatherGeometry(): THREE.PlaneGeometry {
  const geometry = new THREE.PlaneGeometry(1, 1, 5, 12)
  const positions = geometry.attributes.position

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index)
    const y = positions.getY(index)
    const normalizedY = y + 0.5
    const taper = Math.pow(Math.sin(normalizedY * Math.PI), 0.38)
    positions.setX(index, x * taper)
    positions.setZ(index, Math.sin(normalizedY * Math.PI) * 0.08 + x * x * 0.03)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function createFeatherTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const gradient = context.createLinearGradient(0, 0, 128, 0)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.15, 'rgba(255,255,255,.72)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.85, 'rgba(255,255,255,.72)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.beginPath()
  context.moveTo(64, 2)
  context.bezierCurveTo(122, 44, 116, 176, 64, 254)
  context.bezierCurveTo(12, 176, 6, 44, 64, 2)
  context.fill()
  context.strokeStyle = 'rgba(160,150,135,.75)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(64, 10)
  context.lineTo(64, 248)
  context.stroke()

  for (let y = 28; y < 232; y += 12) {
    const width = 42 * Math.sin((y / 256) * Math.PI)
    context.strokeStyle = 'rgba(150,145,136,.18)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(63, y)
    context.lineTo(64 - width, y - 11)
    context.moveTo(65, y)
    context.lineTo(64 + width, y - 11)
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function FeatherWings({ fractureProgressRef }: Pick<HeroSceneProps, 'fractureProgressRef'>) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const feathers = useMemo(() => createWingLayout(72), [])
  const geometry = useMemo(createFeatherGeometry, [])
  const texture = useMemo(createFeatherTexture, [])
  const object = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    feathers.forEach((feather, index) => {
      color.set(index % 17 === 0 ? '#e4d8ad' : '#f3f0e9')
      mesh.setColorAt(index, color)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [color, feathers])

  useFrame(({ clock, pointer }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const time = clock.elapsedTime
    const fracture = fractureProgressRef.current
    const cursorX = pointer.x * 5.4
    const cursorY = pointer.y * 2.8

    feathers.forEach((feather, index) => {
      const sectionStrength =
        feather.side === 'right' && feather.group >= 3
          ? fracture * (feather.group - 2) * 0.2
          : feather.side === 'left' && feather.group === 5
            ? fracture * 0.08
            : fracture * 0.025
      const detachStrength = feather.detached
        ? Math.min(1.35, fracture * 1.65)
        : sectionStrength
      const float = Math.sin(time * 0.38 + feather.phase) * 0.035
      const dx = feather.position[0] - cursorX
      const dy = feather.position[1] - cursorY
      const distance = Math.max(0.25, Math.sqrt(dx * dx + dy * dy))
      const repulsion = distance < 1.15 ? (1.15 - distance) * 0.13 : 0
      const hiddenScale = feather.hidden ? 0.001 : 1

      object.position.set(
        feather.position[0] + feather.drift[0] * detachStrength + (dx / distance) * repulsion,
        feather.position[1] + feather.drift[1] * detachStrength + float + (dy / distance) * repulsion,
        feather.position[2] + feather.drift[2] * detachStrength,
      )
      object.rotation.set(
        feather.rotation[0] + Math.sin(time * 0.24 + feather.phase) * 0.018,
        feather.rotation[1] + detachStrength * feather.drift[2] * 0.24,
        feather.rotation[2] + detachStrength * feather.drift[0] * 0.16,
      )
      object.scale.set(
        feather.scale[0] * hiddenScale,
        feather.scale[1] * hiddenScale,
        feather.scale[2] * hiddenScale,
      )
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, feathers.length]} frustumCulled={false}>
      <meshStandardMaterial
        alphaMap={texture}
        alphaTest={0.08}
        color="#f6f2ea"
        metalness={0.03}
        roughness={0.42}
        side={THREE.DoubleSide}
        transparent
        vertexColors
      />
    </instancedMesh>
  )
}

function Atmosphere() {
  const cloudRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (cloudRef.current) cloudRef.current.position.x = Math.sin(clock.elapsedTime * 0.08) * 0.16
  })

  return (
    <>
      <group ref={cloudRef} position={[0, -2.25, -1.5]}>
        {Array.from({ length: 11 }, (_, index) => (
          <mesh
            key={index}
            position={[(index - 5) * 1.35, Math.sin(index * 1.7) * 0.24, -index * 0.04]}
            scale={[2.4 + (index % 3) * 0.5, 0.62 + (index % 2) * 0.22, 1]}
          >
            <sphereGeometry args={[1, 20, 12]} />
            <meshStandardMaterial color="#faf8f4" roughness={1} transparent opacity={0.58} />
          </mesh>
        ))}
      </group>
      <mesh position={[4.8, 4.2, -4]} rotation={[0, 0, -0.38]} scale={[0.52, 9, 1]}>
        <planeGeometry />
        <meshBasicMaterial
          color="#f6d98a"
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={0.12}
          transparent
        />
      </mesh>
    </>
  )
}

function CameraRig() {
  useFrame(({ camera, pointer }, delta) => {
    const targetX = pointer.x * 0.2
    const targetY = pointer.y * 0.12
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.5, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.25 + targetY, 2.5, delta)
    camera.lookAt(0, 0.15, 0)
  })
  return null
}

export function HeroScene({ fractureProgressRef, showStats = false }: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.25, 9.8], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#faf8f4']} />
      <fog attach="fog" args={['#faf8f4', 8, 20]} />
      <ambientLight intensity={1.8} />
      <directionalLight color="#fff7df" intensity={4.2} position={[6, 7, 6]} />
      <directionalLight color="#d8e2ea" intensity={0.9} position={[-5, 1, 3]} />
      <FeatherWings fractureProgressRef={fractureProgressRef} />
      <Atmosphere />
      <CameraRig />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.18} luminanceThreshold={0.78} mipmapBlur />
        <DepthOfField focusDistance={0.022} focalLength={0.045} bokehScale={1.15} />
        <Vignette darkness={0.14} offset={0.42} />
      </EffectComposer>
      {showStats && <Stats className="fps-stats" showPanel={0} />}
    </Canvas>
  )
}

'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei/core/Gltf.js'
import { Stats } from '@react-three/drei/core/Stats.js'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import {
  createFeatherFrame,
  createFeatherSeeds,
  getPointerGustStrength,
  getVisibleFeatherCount,
  type FeatherFrame,
  type FeatherSeed,
  writeFeatherFrame,
} from '@/lib/atlas-motion/feather-fall'

interface FeatherFallSceneProps {
  readonly isConstrained: boolean
  readonly isMobile: boolean
  readonly showStats: boolean
}

interface ScrollState {
  documentProgress: number
  velocity: number
}

interface GustState {
  serial: number
  strength: number
  x: number
  y: number
}

interface FeatherInstancesProps {
  readonly frameRef: React.MutableRefObject<FeatherFrame>
  readonly geometry: THREE.BufferGeometry
  readonly gustRef: React.MutableRefObject<GustState>
  readonly layer: 0 | 1
  readonly material: THREE.MeshPhysicalMaterial
  readonly records: readonly FeatherSeed[]
}

const modelPath = '/models/feather-variants.glb'
const dracoPath = '/draco/'

function createFeatherMaterial(layer: 0 | 1): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#F5F2EC',
    depthWrite: false,
    metalness: 0.01,
    opacity: layer === 0 ? 0.3 : 0.12,
    roughness: layer === 0 ? 0.4 : 0.82,
    side: THREE.DoubleSide,
    transparent: true,
  })
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
        float featherRim = pow(
          1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0),
          3.1
        );
        outgoingLight += vec3(0.831, 0.686, 0.216) * featherRim * 0.85;
        #include <opaque_fragment>
      `,
    )
  }
  material.customProgramCacheKey = () => `atlas-feather-fresnel-${layer}-v1`
  return material
}

function wrap(value: number, span: number): number {
  return ((((value + span * 0.5) % span) + span) % span) - span * 0.5
}

function FeatherInstances({
  frameRef,
  geometry,
  gustRef,
  layer,
  material,
  records,
}: FeatherInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const gustX = useMemo(() => new Float32Array(records.length), [records.length])
  const gustY = useMemo(() => new Float32Array(records.length), [records.length])
  const gustVelocityX = useMemo(() => new Float32Array(records.length), [records.length])
  const gustVelocityY = useMemo(() => new Float32Array(records.length), [records.length])
  const lastGustSerial = useRef(0)
  const { viewport } = useThree()

  useEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  }, [])

  useFrame(({ clock }, rawDelta) => {
    const mesh = meshRef.current
    if (!mesh) return
    const frame = frameRef.current
    const delta = Math.min(rawDelta, 1 / 20)
    const elapsed = clock.elapsedTime
    const visibleCount = getVisibleFeatherCount(records.length, frame.density)
    const verticalSpan = viewport.height + 4
    const gust = gustRef.current
    const receivesGust = gust.serial !== lastGustSerial.current
    const gustWorldX = gust.x * viewport.width * 0.5
    const gustWorldY = gust.y * viewport.height * 0.5
    mesh.count = visibleCount

    for (let index = 0; index < visibleCount; index += 1) {
      const seed = records[index]
      const fall = elapsed * (0.13 + frame.fallSpeed * 0.68) * seed.drift
      const baseX = seed.x * viewport.width * 0.49
      const baseY = wrap(seed.y * viewport.height * 0.5 - fall, verticalSpan)
      const driftX = Math.sin(elapsed * 0.24 + seed.phase) * frame.scatter * 0.46
      const windX = frame.wind * (0.22 + seed.drift * 0.26)
      const settleY = frame.settle * (-viewport.height * 0.32 - seed.size * 0.65)
      let positionX = baseX + driftX + windX
      let positionY = baseY + settleY

      if (receivesGust) {
        const differenceX = positionX - gustWorldX
        const differenceY = positionY - gustWorldY
        const distance = Math.hypot(differenceX, differenceY)
        const radius = Math.max(1.6, viewport.width * 0.17)
        const strength = getPointerGustStrength(500 + gust.strength * 600, distance, radius)
        if (strength > 0) {
          const inverseDistance = 1 / Math.max(0.001, distance)
          gustVelocityX[index] += differenceX * inverseDistance * strength * 3.1
          gustVelocityY[index] += differenceY * inverseDistance * strength * 2.5
        }
      }

      gustVelocityX[index] += -gustX[index] * 17 * delta
      gustVelocityY[index] += -gustY[index] * 17 * delta
      const damping = Math.exp(-7.2 * delta)
      gustVelocityX[index] *= damping
      gustVelocityY[index] *= damping
      gustX[index] += gustVelocityX[index] * delta
      gustY[index] += gustVelocityY[index] * delta
      positionX += gustX[index]
      positionY += gustY[index]

      const size = seed.size * seed.readability * (layer === 0 ? 0.76 : 0.58)
      dummy.position.set(positionX, positionY, seed.z)
      dummy.rotation.set(
        Math.sin(elapsed * 0.31 + seed.phase) * frame.tumble * 0.46,
        elapsed * (0.09 + seed.drift * 0.035) * seed.tumbleDirection * frame.tumble,
        -Math.PI * 0.5 + seed.phase + Math.sin(elapsed * 0.18 + seed.phase) * 0.3,
      )
      dummy.scale.set(size * (1 + frame.streak * 0.52), size, size)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    }
    if (receivesGust) lastGustSerial.current = gust.serial
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, records.length]}
      frustumCulled={false}
      renderOrder={layer === 0 ? 2 : 1}
    />
  )
}

function FeatherField({ isConstrained, isMobile }: Pick<
  FeatherFallSceneProps,
  'isConstrained' | 'isMobile'
>) {
  const { scene } = useGLTF(modelPath, dracoPath, true)
  const model = useMemo(() => scene.clone(true), [scene])
  const count = isMobile || isConstrained ? 40 : 120
  const seeds = useMemo(() => createFeatherSeeds(count, 1217), [count])
  const frameRef = useRef(createFeatherFrame())
  const scrollRef = useRef<ScrollState>({ documentProgress: 0, velocity: 0 })
  const gustRef = useRef<GustState>({ serial: 0, strength: 0, x: 0, y: 0 })
  const nearMaterial = useMemo(() => createFeatherMaterial(0), [])
  const farMaterial = useMemo(() => createFeatherMaterial(1), [])
  const geometries = useMemo(
    () =>
      ([1, 2, 3] as const).map((number) => {
        const node = model.getObjectByName(`feather_variant_0${number}`)
        if (!(node instanceof THREE.Mesh)) throw new Error(`Missing feather variant ${number}`)
        return node.geometry
      }),
    [model],
  )
  const batches = useMemo(
    () =>
      geometries.flatMap((geometry, variant) =>
        ([0, 1] as const).map((layer) => ({
          geometry,
          layer,
          records: seeds
            .filter((seed) => seed.variant === variant && seed.layer === layer)
            .sort((left, right) => left.activation - right.activation),
        })),
      ),
    [geometries, seeds],
  )

  useEffect(() => {
    const scrollHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
    scrollRef.current.documentProgress = Math.min(1, Math.max(0, window.scrollY / scrollHeight))
    const handleScroll = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ScrollState>>).detail
      if (typeof detail?.documentProgress === 'number') {
        scrollRef.current.documentProgress = detail.documentProgress
      }
      if (typeof detail?.velocity === 'number') scrollRef.current.velocity = detail.velocity
    }
    window.addEventListener('atlas:scroll', handleScroll)
    return () => window.removeEventListener('atlas:scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isMobile) return
    let lastX = 0
    let lastY = 0
    let lastTime = performance.now()
    const handlePointer = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const now = performance.now()
      const elapsed = Math.max(8, now - lastTime)
      const velocity = (Math.hypot(event.clientX - lastX, event.clientY - lastY) / elapsed) * 1000
      lastX = event.clientX
      lastY = event.clientY
      lastTime = now
      const strength = getPointerGustStrength(velocity, 0, 1)
      if (strength === 0) return
      const gust = gustRef.current
      gust.x = (event.clientX / window.innerWidth) * 2 - 1
      gust.y = 1 - (event.clientY / window.innerHeight) * 2
      gust.strength = strength
      gust.serial += 1
    }
    window.addEventListener('pointermove', handlePointer, { passive: true })
    return () => window.removeEventListener('pointermove', handlePointer)
  }, [isMobile])

  useEffect(
    () => () => {
      nearMaterial.dispose()
      farMaterial.dispose()
    },
    [farMaterial, nearMaterial],
  )

  useFrame(() => {
    writeFeatherFrame(
      scrollRef.current.documentProgress,
      scrollRef.current.velocity,
      frameRef.current,
    )
    nearMaterial.opacity = frameRef.current.opacity * 0.34
    farMaterial.opacity = frameRef.current.opacity * 0.14
  }, -1)

  return (
    <>
      <ambientLight intensity={1.25} color="#f5f2ec" />
      <directionalLight position={[5, 6, 4]} intensity={2.1} color="#ffdca0" />
      <directionalLight position={[-4, 1, 2]} intensity={0.72} color="#b7c8dc" />
      {batches.map((batch) => (
        <FeatherInstances
          key={`${batch.layer}-${batch.records[0]?.variant ?? 'empty'}`}
          frameRef={frameRef}
          geometry={batch.geometry}
          gustRef={gustRef}
          layer={batch.layer}
          material={batch.layer === 0 ? nearMaterial : farMaterial}
          records={batch.records}
        />
      ))}
    </>
  )
}

function MobileInvalidator() {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidate()
    const timer = globalThis.setInterval(invalidate, 1000 / 30)
    return () => globalThis.clearInterval(timer)
  }, [invalidate])
  return null
}

function FeatherTelemetry() {
  const elementRef = useRef<HTMLElement | null>(null)
  const frameCount = useRef(0)
  const lastSample = useRef(0)

  useEffect(() => {
    elementRef.current = document.querySelector<HTMLElement>('[data-feather-fall-layer]')
  }, [])

  useFrame(({ clock }) => {
    frameCount.current += 1
    const elapsed = clock.elapsedTime
    if (elapsed - lastSample.current < 1) return
    const duration = Math.max(0.001, elapsed - lastSample.current)
    elementRef.current?.setAttribute(
      'data-feather-fps',
      String(Math.round(frameCount.current / duration)),
    )
    frameCount.current = 0
    lastSample.current = elapsed
  })
  return null
}

export function FeatherFallScene({ isConstrained, isMobile, showStats }: FeatherFallSceneProps) {
  const capped = isMobile || isConstrained
  return (
    <Canvas
      camera={{ position: [0, 0, 8], zoom: 80 }}
      dpr={capped ? 1 : [1, 1.4]}
      frameloop={capped ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      orthographic
      className="feather-fall-canvas"
    >
      {capped && <MobileInvalidator />}
      <FeatherTelemetry />
      <Suspense fallback={null}>
        <FeatherField isConstrained={isConstrained} isMobile={isMobile} />
      </Suspense>
      {showStats && <Stats className="feather-fall-stats" />}
    </Canvas>
  )
}

useGLTF.preload(modelPath, dracoPath, true)

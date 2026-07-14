'use client'

import { Environment, Lightformer, Stats, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { SceneAffordancePosition, SectionSceneVariant } from './SectionSceneExperience'
import { getDescentLighting, getLandingProgress } from '@/lib/descent-choreography'

interface SectionSceneProps {
  readonly variant: SectionSceneVariant
  readonly progressRef: React.MutableRefObject<number>
  readonly activeIndex: number | null
  readonly affordanceIndex: number | null
  readonly isMobile: boolean
  readonly onAffordancePosition: (position: SceneAffordancePosition | null) => void
  readonly showStats?: boolean
  readonly visitedIndices: readonly number[]
}

interface VeinMaterial extends THREE.MeshPhysicalMaterial {
  userData: {
    goldResponse?: { value: number }
  }
}

const sceneConfig = {
  ruins: {
    model: '/models/ruins-ring.glb',
    scale: 0.82,
    position: [0, -0.22, 0] as const,
    camera: [0, 1.55, 5.8] as const,
    target: [0, 0.1, -5.4] as const,
    fov: 47,
    background: '#E5E8E8',
    warmBackground: '#F1ECE3',
    fogNear: 5.5,
    fogFar: 27,
    exposure: 0.86,
    ambientIntensity: 0.34,
    keyIntensity: 1.55,
    keyPosition: [7, 8, 3] as const,
    fillIntensity: 0.36,
    progressTravel: [0, -0.15, -0.65] as const,
  },
  stairs: {
    model: '/models/stair-timeline.glb',
    scale: 0.68,
    position: [-1.4, -3.5, 0] as const,
    camera: [4.4, 5.7, 12.8] as const,
    target: [-1.2, -2.1, -1.4] as const,
    fov: 43,
    background: '#D6DADC',
    warmBackground: '#E8E3DA',
    fogNear: 7,
    fogFar: 31,
    exposure: 0.78,
    ambientIntensity: 0.26,
    keyIntensity: 1.42,
    keyPosition: [6, 9, 4] as const,
    fillIntensity: 0.28,
    progressTravel: [-0.9, -6.4, -1.5] as const,
  },
  monolith: {
    model: '/models/monolith-field.glb',
    scale: 0.82,
    position: [0, -0.65, 0] as const,
    camera: [0, 1.15, 10.5] as const,
    target: [0, -0.15, -9] as const,
    fov: 45,
    background: '#BFC5C3',
    warmBackground: '#D8D4CC',
    fogNear: 6.5,
    fogFar: 25,
    exposure: 0.7,
    ambientIntensity: 0.2,
    keyIntensity: 1.15,
    keyPosition: [7, 8, 2] as const,
    fillIntensity: 0.23,
    progressTravel: [0.4, -0.35, -3.2] as const,
  },
} as const

const dracoPath = '/draco/'

const interactionTargets: Record<SectionSceneVariant, readonly string[]> = {
  ruins: ['ruin_arch_03', 'ruin_column_01', 'ruin_fragment_01', 'ruin_arch_02', 'ruin_column_03'],
  stairs: ['stair_landing_01', 'stair_landing_02', 'stair_landing_03', 'stair_landing_04'],
  monolith: ['monolith_01', 'monolith_02', 'monolith_03'],
}

export function createVeinedMarbleMaterial(): VeinMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#F5F2EC',
    roughness: 0.4,
    metalness: 0.025,
    clearcoat: 0.08,
    clearcoatRoughness: 0.56,
    envMapIntensity: 0.72,
    side: THREE.DoubleSide,
  }) as VeinMaterial
  const goldResponse = { value: 0 }
  material.userData.goldResponse = goldResponse
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGoldResponse = goldResponse
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vVeinPosition;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvVeinPosition = position;',
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uGoldResponse;\nvarying vec3 vVeinPosition;',
      )
      .replace(
        '#include <opaque_fragment>',
        `
          float warp = sin(vVeinPosition.z * 2.3 + sin(vVeinPosition.y * 1.7)) * 0.9;
          float veinA = abs(sin(vVeinPosition.x * 2.35 + vVeinPosition.y * 0.72 + warp));
          float veinB = abs(sin(vVeinPosition.x * 3.7 - vVeinPosition.y * 1.65 + sin(vVeinPosition.z * 1.9) * 0.7));
          float vein = smoothstep(0.982, 0.997, veinA);
          vein += smoothstep(0.992, 0.999, veinB) * 0.48;
          float rim = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.2);
          vec3 signatureGold = vec3(0.831, 0.686, 0.216);
          outgoingLight += signatureGold * (rim * 0.18 + vein * (0.015 + uGoldResponse * 1.45));
          #include <opaque_fragment>
        `,
      )
  }
  material.customProgramCacheKey = () => 'signature-veined-marble-v2'
  return material
}

function createCloudTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  let state = seed >>> 0
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
  for (let index = 0; index < 30; index += 1) {
    const x = random() * canvas.width
    const y = 58 + random() * 102
    const radius = 26 + random() * 72
    const gradient = context.createRadialGradient(x, y, 1, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,.78)')
    gradient.addColorStop(0.55, 'rgba(238,234,226,.42)')
    gradient.addColorStop(1, 'rgba(220,224,226,0)')
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function SceneModel({
  variant,
  progressRef,
  activeIndex,
  affordanceIndex,
  onAffordancePosition,
  visitedIndices,
}: Pick<
  SectionSceneProps,
  'variant' | 'progressRef' | 'activeIndex' | 'affordanceIndex' | 'onAffordancePosition' | 'visitedIndices'
>) {
  const config = sceneConfig[variant]
  const groupRef = useRef<THREE.Group>(null)
  const projectionFrameRef = useRef(0)
  const projectedPositionRef = useRef(new THREE.Vector3())
  const lastAffordanceRef = useRef<SceneAffordancePosition | null>(null)
  const { scene } = useGLTF(config.model, dracoPath, true)
  const model = useMemo(() => scene.clone(true), [scene])
  const materials = useMemo(() => new Map<string, VeinMaterial>(), [])
  const visitedSet = useMemo(() => new Set(visitedIndices), [visitedIndices])

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      const material = createVeinedMarbleMaterial()
      materials.set(object.name, material)
      object.material = material
      object.castShadow = false
      object.receiveShadow = false
    })
    return () => {
      materials.forEach((material) => material.dispose())
      materials.clear()
    }
  }, [materials, model])

  useEffect(
    () => () => onAffordancePosition(null),
    [onAffordancePosition],
  )

  useFrame(({ camera, clock, pointer, size }, delta) => {
    const group = groupRef.current
    if (group) {
      const progress = progressRef.current
      group.position.y = config.position[1] + Math.sin(clock.elapsedTime * 0.18) * 0.045
      group.rotation.y = THREE.MathUtils.damp(
        group.rotation.y,
        pointer.x * -0.075 + (variant === 'ruins' ? progress * 0.32 : 0),
        2.1,
        delta,
      )
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pointer.y * -0.025, 2.1, delta)
    }

    const targets = interactionTargets[variant]
    materials.forEach((material, name) => {
      const primaryIndex = targets.indexOf(name)
      if (primaryIndex < 0) return
      const response = material.userData.goldResponse
      if (response) {
        const shimmer = !visitedSet.has(primaryIndex)
          ? 0.08 + Math.max(0, Math.sin(clock.elapsedTime * 0.72 + primaryIndex * 1.7)) ** 12 * 0.24
          : 0
        const target = activeIndex === primaryIndex
          ? 1
          : variant === 'stairs' ? getLandingProgress(progressRef.current, primaryIndex) * 0.32 : shimmer
        response.value = THREE.MathUtils.damp(response.value, target, 5, delta)
      }
    })

    projectionFrameRef.current += 1
    if (projectionFrameRef.current % 8 !== 0 || affordanceIndex === null || !group) return
    const targetObject = model.getObjectByName(targets[affordanceIndex])
    if (!targetObject) {
      onAffordancePosition(null)
      return
    }
    group.updateWorldMatrix(true, true)
    const projected = projectedPositionRef.current
    targetObject.getWorldPosition(projected)
    projected.project(camera)
    if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.12 || Math.abs(projected.y) > 1.12) {
      if (lastAffordanceRef.current) {
        lastAffordanceRef.current = null
        onAffordancePosition(null)
      }
      return
    }
    const nextPosition = {
      x: (projected.x * 0.5 + 0.5) * size.width,
      y: (-projected.y * 0.5 + 0.5) * size.height,
    }
    const lastPosition = lastAffordanceRef.current
    if (
      !lastPosition ||
      Math.abs(lastPosition.x - nextPosition.x) > 3 ||
      Math.abs(lastPosition.y - nextPosition.y) > 3
    ) {
      lastAffordanceRef.current = nextPosition
      onAffordancePosition(nextPosition)
    }
  })

  return (
    <group ref={groupRef} position={config.position} scale={config.scale}>
      <primitive object={model} />
    </group>
  )
}

function CloudPlanes({ variant }: Pick<SectionSceneProps, 'variant'>) {
  const groupRef = useRef<THREE.Group>(null)
  const textures = useMemo(() => [71, 117, 191].map(createCloudTexture), [])
  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures])
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.position.x = Math.sin(clock.elapsedTime * 0.05) * 0.25
  })
  const baseY = variant === 'stairs' ? -3.9 : variant === 'monolith' ? -2.35 : -3.25
  return (
    <group ref={groupRef}>
      {textures.map((texture, index) => (
        <mesh
          key={index}
          position={[(index - 1) * 3.2, baseY - index * 0.28, -2.2 + index * 1.1]}
          scale={[13 + index * 2, 4.1 + index * 0.6, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            color={index === 0 ? '#D7D9D8' : '#F4EFE7'}
            depthWrite={false}
            opacity={0.52 + index * 0.08}
            transparent
          />
        </mesh>
      ))}
    </group>
  )
}

function Dust() {
  const pointsRef = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const values = new Float32Array(96 * 3)
    let state = 92317
    const random = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff
      return state / 0x7fffffff
    }
    for (let index = 0; index < 96; index += 1) {
      values[index * 3] = (random() - 0.5) * 18
      values[index * 3 + 1] = (random() - 0.5) * 10
      values[index * 3 + 2] = (random() - 0.5) * 9
    }
    return values
  }, [])
  useFrame(({ clock }) => {
    if (pointsRef.current) pointsRef.current.rotation.y = clock.elapsedTime * 0.006
  })
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#CDBB87" depthWrite={false} opacity={0.34} size={0.026} transparent />
    </points>
  )
}

function CameraRig({ variant, progressRef }: Pick<SectionSceneProps, 'variant' | 'progressRef'>) {
  const target = useMemo(() => new THREE.Vector3(), [])
  const atmosphere = useMemo(() => new THREE.Color(), [])
  const warm = useMemo(() => new THREE.Color(sceneConfig[variant].warmBackground), [variant])
  const cool = useMemo(() => new THREE.Color(sceneConfig[variant].background), [variant])
  useFrame(({ camera, pointer, scene }, delta) => {
    const config = sceneConfig[variant]
    const progress = progressRef.current
    const lighting = getDescentLighting(progress)
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      config.camera[0] + config.progressTravel[0] * progress + pointer.x * 0.36,
      2.4,
      delta,
    )
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      config.camera[1] + config.progressTravel[1] * progress + pointer.y * 0.16,
      2.4,
      delta,
    )
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      config.camera[2] + config.progressTravel[2] * progress,
      2.5,
      delta,
    )
    target.set(
      config.target[0],
      config.target[1] + (variant === 'stairs' ? config.progressTravel[1] * progress * 0.72 : 0),
      config.target[2] + (variant === 'monolith' ? config.progressTravel[2] * progress * 0.55 : 0),
    )
    camera.lookAt(target)
    atmosphere.copy(cool).lerp(warm, lighting.warmth * 0.45)
    if (scene.background instanceof THREE.Color) scene.background.copy(atmosphere)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(atmosphere)
      scene.fog.near = config.fogNear + (lighting.fogNear - 7.5) * 0.2
      scene.fog.far = config.fogFar
    }
  })
  return null
}

function SoftEnvironment() {
  return (
    <Environment resolution={64} frames={1}>
      <Lightformer color="#FFF0CE" form="rect" intensity={2} position={[5, 7, 5]} scale={[6, 6, 1]} />
      <Lightformer color="#D6E0E7" form="rect" intensity={0.85} position={[-5, 2, 3]} scale={[5, 4, 1]} />
    </Environment>
  )
}

function MobileFrameLoop() {
  const advance = useThree((state) => state.advance)
  useEffect(() => {
    let frame = 0
    let last = 0
    const tick = (time: number) => {
      if (time - last >= 32) {
        advance(time)
        last = time
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [advance])
  return null
}

function World(props: Omit<SectionSceneProps, 'showStats'>) {
  const config = sceneConfig[props.variant]
  return (
    <>
      <color attach="background" args={[config.background]} />
      <fog attach="fog" args={[config.background, config.fogNear, config.fogFar]} />
      <ambientLight intensity={config.ambientIntensity} />
      <directionalLight color="#FFE8B5" intensity={config.keyIntensity} position={config.keyPosition} />
      <directionalLight color="#C8D7DF" intensity={config.fillIntensity} position={[-5, 2, 4]} />
      <SoftEnvironment />
      <SceneModel {...props} />
      <CloudPlanes variant={props.variant} />
      <Dust />
      <CameraRig variant={props.variant} progressRef={props.progressRef} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.12} luminanceThreshold={0.86} mipmapBlur />
        <Vignette darkness={0.07} offset={0.52} />
      </EffectComposer>
      {props.isMobile && <MobileFrameLoop />}
    </>
  )
}

export function SectionScene({ showStats = false, ...props }: SectionSceneProps) {
  const config = sceneConfig[props.variant]
  return (
    <Canvas
      dpr={props.isMobile ? [1, 1.05] : [1, 1.2]}
      camera={{ position: config.camera, fov: config.fov, near: 0.1, far: 70 }}
      frameloop={props.isMobile ? 'never' : 'always'}
      gl={{ antialias: !props.isMobile, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = config.exposure
      }}
    >
      <Suspense fallback={null}>
        <World {...props} />
      </Suspense>
      {showStats && <Stats className="fps-stats" showPanel={0} />}
    </Canvas>
  )
}

Object.values(sceneConfig).forEach(({ model }) => useGLTF.preload(model, dracoPath, true))

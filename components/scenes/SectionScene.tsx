'use client'

import { Environment, Lightformer, Stats, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import type { SectionSceneVariant } from './SectionSceneExperience'
import { getDescentLighting, getLandingProgress } from '@/lib/descent-choreography'

interface SectionSceneProps {
  readonly variant: SectionSceneVariant
  readonly progressRef: React.MutableRefObject<number>
  readonly activeIndex: number | null
  readonly isMobile: boolean
  readonly showStats?: boolean
}

interface VeinMaterial extends THREE.MeshPhysicalMaterial {
  userData: {
    goldResponse?: { value: number }
  }
}

const sceneConfig = {
  ruins: {
    model: '/models/ruins-ring.glb',
    scale: 0.72,
    position: [0, -0.25, 0] as const,
    camera: [0, 2.1, 14.5] as const,
  },
  stairs: {
    model: '/models/stair-timeline.glb',
    scale: 0.6,
    position: [0, -4.6, 0] as const,
    camera: [0, 0.4, 16] as const,
  },
  monolith: {
    model: '/models/monolith-field.glb',
    scale: 0.78,
    position: [0, -0.45, 1.3] as const,
    camera: [0, 1.1, 15.5] as const,
  },
} as const

const dracoPath = '/draco/'

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

function SceneModel({ variant, progressRef, activeIndex }: Pick<SectionSceneProps, 'variant' | 'progressRef' | 'activeIndex'>) {
  const config = sceneConfig[variant]
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(config.model, dracoPath, true)
  const model = useMemo(() => scene.clone(true), [scene])
  const materials = useMemo(() => new Map<string, VeinMaterial>(), [])

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

  useFrame(({ clock, pointer }, delta) => {
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

    const primaryPrefix = variant === 'ruins' ? 'ruin_arch_' : variant === 'stairs' ? 'stair_landing_' : 'monolith_'
    let primaryIndex = 0
    materials.forEach((material, name) => {
      if (!name.startsWith(primaryPrefix) || name.startsWith('monolith_decor_')) return
      const response = material.userData.goldResponse
      if (response) {
        const target = activeIndex === primaryIndex
          ? 1
          : variant === 'stairs' ? getLandingProgress(progressRef.current, primaryIndex) * 0.32 : 0
        response.value = THREE.MathUtils.damp(response.value, target, 5, delta)
      }
      primaryIndex += 1
    })
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
  const baseY = variant === 'stairs' ? -3.9 : -3.25
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
  const warm = useMemo(() => new THREE.Color('#FAF8F4'), [])
  const cool = useMemo(() => new THREE.Color('#E4E7E7'), [])
  useFrame(({ camera, pointer, scene }, delta) => {
    const config = sceneConfig[variant]
    const progress = progressRef.current
    const lighting = getDescentLighting(progress)
    const stairDescent = variant === 'stairs' ? progress * 4.4 : 0
    camera.position.x = THREE.MathUtils.damp(camera.position.x, config.camera[0] + pointer.x * 0.42, 2.4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, config.camera[1] - stairDescent + pointer.y * 0.18, 2.4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, config.camera[2] - progress * 1.1, 2.5, delta)
    target.set(0, variant === 'stairs' ? -2.2 - stairDescent : 0, -0.5)
    camera.lookAt(target)
    const atmosphere = cool.clone().lerp(warm, lighting.warmth)
    if (scene.background instanceof THREE.Color) scene.background.copy(atmosphere)
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(atmosphere)
      scene.fog.near = lighting.fogNear
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
  return (
    <>
      <color attach="background" args={['#FAF8F4']} />
      <fog attach="fog" args={['#FAF8F4', 8, 28]} />
      <ambientLight intensity={0.5} />
      <directionalLight color="#FFE8B5" intensity={1.7} position={[6, 7, 5]} />
      <directionalLight color="#D7E3EA" intensity={0.42} position={[-5, 2, 4]} />
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
  return (
    <Canvas
      dpr={props.isMobile ? [1, 1.05] : [1, 1.2]}
      camera={{ position: sceneConfig[props.variant].camera, fov: 40, near: 0.1, far: 70 }}
      frameloop={props.isMobile ? 'never' : 'always'}
      gl={{ antialias: !props.isMobile, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.72
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

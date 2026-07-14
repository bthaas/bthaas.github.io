'use client'

import { Environment, Lightformer, Stats, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  EffectComposer,
  GodRays,
  Vignette,
} from '@react-three/postprocessing'
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as THREE from 'three'

import {
  getHeroChoreography,
  type WingClusterName,
  wingClusterNames,
} from '@/lib/hero-choreography'

interface HeroSceneProps {
  readonly fractureProgressRef: React.MutableRefObject<number>
  readonly isMobile: boolean
  readonly showStats?: boolean
}

interface RestTransform {
  readonly position: THREE.Vector3
  readonly rotation: THREE.Euler
}

interface ClusterMotion {
  readonly drift: readonly [number, number, number]
  readonly rotation: readonly [number, number, number]
}

const clusterMotions: Readonly<Record<WingClusterName, ClusterMotion>> = {
  wingR_tip: { drift: [1.55, 1.35, 0.42], rotation: [0.12, -0.3, 0.32] },
  wingR_mid: { drift: [1.05, 0.82, -0.22], rotation: [-0.08, 0.22, -0.2] },
  wingL_tip: { drift: [-0.82, 0.72, 0.28], rotation: [0.07, 0.16, -0.2] },
  wingR_root: { drift: [0.44, 0.48, 0.16], rotation: [0.04, -0.13, 0.11] },
  wingL_mid: { drift: [-0.32, 0.36, -0.12], rotation: [-0.04, 0.1, -0.08] },
  wingL_root: { drift: [-0.12, 0.2, 0.06], rotation: [0.02, -0.05, 0.04] },
}

const modelPath = '/models/wings.glb'
const dracoPath = '/draco/'

function createMarbleMaterial(): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#F5F2EC',
    roughness: 0.4,
    metalness: 0.02,
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.72,
    side: THREE.DoubleSide,
  })

  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `
        float marbleRim = pow(
          1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0),
          3.35
        );
        outgoingLight += vec3(0.831, 0.686, 0.216) * marbleRim * 0.38;
        #include <opaque_fragment>
      `,
    )
  }
  material.customProgramCacheKey = () => 'marble-gold-fresnel-v1'
  return material
}

function createCloudTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 768
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  let randomState = seed >>> 0
  const random = () => {
    randomState = (randomState * 1664525 + 1013904223) >>> 0
    return randomState / 4294967296
  }

  context.clearRect(0, 0, canvas.width, canvas.height)
  for (let index = 0; index < 48; index += 1) {
    const x = random() * canvas.width
    const y = 78 + random() * 135
    const radiusX = 45 + random() * 105
    const radiusY = 22 + random() * 52
    const gradient = context.createRadialGradient(x, y, 2, x, y, radiusX)
    gradient.addColorStop(0, 'rgba(255, 255, 255, .82)')
    gradient.addColorStop(0.46, 'rgba(250, 248, 244, .62)')
    gradient.addColorStop(1, 'rgba(232, 225, 214, 0)')
    context.save()
    context.translate(x, y)
    context.scale(1, radiusY / radiusX)
    context.translate(-x, -y)
    context.fillStyle = gradient
    context.beginPath()
    context.arc(x, y, radiusX, 0, Math.PI * 2)
    context.fill()
    context.restore()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

function createHorizonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const vertical = context.createLinearGradient(0, 0, 0, canvas.height)
  vertical.addColorStop(0, 'rgba(250, 248, 244, 0)')
  vertical.addColorStop(0.34, 'rgba(238, 219, 187, .18)')
  vertical.addColorStop(0.64, 'rgba(219, 205, 187, .48)')
  vertical.addColorStop(1, 'rgba(184, 190, 193, .56)')
  context.fillStyle = vertical
  context.fillRect(0, 0, canvas.width, canvas.height)

  const sunGlow = context.createRadialGradient(548, 172, 4, 548, 172, 260)
  sunGlow.addColorStop(0, 'rgba(255, 244, 202, .8)')
  sunGlow.addColorStop(0.22, 'rgba(250, 222, 164, .42)')
  sunGlow.addColorStop(1, 'rgba(250, 222, 164, 0)')
  context.fillStyle = sunGlow
  context.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function Wings({ fractureProgressRef }: Pick<HeroSceneProps, 'fractureProgressRef'>) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(modelPath, dracoPath, true)
  const model = useMemo(() => scene.clone(true), [scene])
  const marbleMaterial = useMemo(createMarbleMaterial, [])
  const restTransforms = useMemo(() => {
    const transforms = new Map<string, RestTransform>()
    model.traverse((object) => {
      transforms.set(object.name, {
        position: object.position.clone(),
        rotation: object.rotation.clone(),
      })
    })
    return transforms
  }, [model])

  useLayoutEffect(() => {
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.material = marbleMaterial
        object.castShadow = false
        object.receiveShadow = false
        object.frustumCulled = true
      }
    })
    return () => marbleMaterial.dispose()
  }, [marbleMaterial, model])

  useFrame(({ clock, pointer }, delta) => {
    const time = clock.elapsedTime
    const choreography = getHeroChoreography(fractureProgressRef.current)
    const group = groupRef.current
    if (group) {
      group.position.y = 0.14 + Math.sin(time * 0.33) * 0.07
      group.rotation.x = THREE.MathUtils.damp(
        group.rotation.x,
        pointer.y * -0.018 + Math.sin(time * 0.19) * 0.006,
        2.2,
        delta,
      )
      group.rotation.y = THREE.MathUtils.damp(
        group.rotation.y,
        pointer.x * -0.027 + Math.sin(time * 0.14) * 0.008,
        2.2,
        delta,
      )
      group.rotation.z = Math.sin(time * 0.23) * 0.006
    }

    wingClusterNames.forEach((name) => {
      const object = model.getObjectByName(name)
      const rest = restTransforms.get(name)
      if (!object || !rest) return
      const detachment = choreography.clusterDetachments[name]
      const motion = clusterMotions[name]
      object.position
        .copy(rest.position)
        .addScaledVector(new THREE.Vector3(...motion.drift), detachment)
      object.rotation.set(
        rest.rotation.x + motion.rotation[0] * detachment,
        rest.rotation.y + motion.rotation[1] * detachment,
        rest.rotation.z + motion.rotation[2] * detachment,
      )
    })

    for (let index = 1; index <= 12; index += 1) {
      const name = `loose_feather_${String(index).padStart(2, '0')}`
      const object = model.getObjectByName(name)
      const rest = restTransforms.get(name)
      if (!object || !rest) continue
      const phase = index * 0.83
      object.position.set(
        rest.position.x + Math.sin(time * 0.16 + phase) * 0.11,
        rest.position.y + Math.cos(time * 0.2 + phase) * 0.085,
        rest.position.z + Math.sin(time * 0.13 + phase) * 0.07,
      )
      object.rotation.set(
        rest.rotation.x + Math.sin(time * 0.12 + phase) * 0.08,
        rest.rotation.y + time * (0.012 + index * 0.0007),
        rest.rotation.z + Math.cos(time * 0.14 + phase) * 0.11,
      )
    }
  })

  return (
    <group ref={groupRef} scale={1.23}>
      <primitive object={model} />
    </group>
  )
}

function CloudLayers() {
  const groupRef = useRef<THREE.Group>(null)
  const horizonTexture = useMemo(createHorizonTexture, [])
  const textures = useMemo(
    () => [17, 39, 63, 91].map((seed) => createCloudTexture(seed)),
    [],
  )

  useEffect(
    () => () => {
      horizonTexture.dispose()
      textures.forEach((texture) => texture.dispose())
    },
    [horizonTexture, textures],
  )
  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.position.x = Math.sin(clock.elapsedTime * 0.055) * 0.18
  })

  const layers = (
    [
      { position: [-2.7, -2.42, -3.7], scale: [11.8, 4.1], opacity: 0.6 },
      { position: [2.2, -2.78, -2.9], scale: [12.8, 4.45], opacity: 0.68 },
      { position: [-1.0, -3.12, -2.1], scale: [14.2, 4.9], opacity: 0.76 },
      { position: [1.8, -3.56, -1.2], scale: [15.5, 5.35], opacity: 0.68 },
    ] as const
  )

  return (
    <group ref={groupRef}>
      <mesh position={[0, -3.45, -5.2]} scale={[20, 8.5, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={horizonTexture}
          depthWrite={false}
          opacity={0.9}
          transparent
        />
      </mesh>
      {layers.map((layer, index) => (
        <mesh
          key={index}
          position={layer.position}
          rotation={[0, 0, (index - 1.5) * 0.025]}
          scale={[layer.scale[0], layer.scale[1], 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={textures[index]}
            color={index < 2 ? '#BFC2C0' : '#D4CEC3'}
            depthWrite={false}
            opacity={layer.opacity}
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
    const values = new Float32Array(210 * 3)
    let state = 43117
    const random = () => {
      state = (state * 1103515245 + 12345) & 0x7fffffff
      return state / 0x7fffffff
    }
    for (let index = 0; index < 210; index += 1) {
      values[index * 3] = (random() - 0.5) * 15
      values[index * 3 + 1] = (random() - 0.5) * 8
      values[index * 3 + 2] = (random() - 0.5) * 7
    }
    return values
  }, [])

  useFrame(({ clock }) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = clock.elapsedTime * 0.008
    pointsRef.current.position.y = Math.sin(clock.elapsedTime * 0.11) * 0.06
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#D7C28B" depthWrite={false} opacity={0.4} size={0.022} transparent />
    </points>
  )
}

function CameraRig({ fractureProgressRef }: Pick<HeroSceneProps, 'fractureProgressRef'>) {
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, pointer, scene }, delta) => {
    const choreography = getHeroChoreography(fractureProgressRef.current)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.32, 2.4, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.36 + pointer.y * 0.18, 2.4, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, choreography.cameraZ, 3.1, delta)
    target.set(pointer.x * 0.08, 0.35 + pointer.y * 0.04, 0)
    camera.lookAt(target)

    const background = scene.background
    if (background instanceof THREE.Color) {
      background.setRGB(
        0.956 + choreography.backgroundLift * 0.55,
        0.946 + choreography.backgroundLift * 0.5,
        0.925 + choreography.backgroundLift * 0.45,
      )
    }
    if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(background as THREE.Color)
  })
  return null
}

function SoftEnvironment() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer
        color="#FFF4D8"
        form="rect"
        intensity={2.1}
        position={[4, 5, 5]}
        rotation={[0, -0.4, 0]}
        scale={[5, 5, 1]}
      />
      <Lightformer
        color="#D9E1E7"
        form="rect"
        intensity={0.9}
        position={[-5, 2, 3]}
        rotation={[0, 0.5, 0]}
        scale={[5, 3, 1]}
      />
    </Environment>
  )
}

function PostProcessing({ isMobile }: Pick<HeroSceneProps, 'isMobile'>) {
  const [sun, setSun] = useState<THREE.Mesh | null>(null)
  const captureSun = useCallback((node: THREE.Mesh | null) => setSun(node), [])

  return (
    <>
      <mesh ref={captureSun} position={[0.48, 0.05, -4.3]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial color="#FFF2C3" toneMapped={false} />
      </mesh>
      {sun &&
        (isMobile ? (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.2} luminanceThreshold={0.78} mipmapBlur />
            <Vignette darkness={0.08} offset={0.5} />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.14} luminanceThreshold={0.82} mipmapBlur />
            <GodRays
              sun={sun}
              blur
              clampMax={1}
              decay={0.94}
              density={0.78}
              exposure={0.13}
              samples={8}
              weight={0.2}
            />
            <Vignette darkness={0.1} offset={0.48} />
          </EffectComposer>
        ))}
    </>
  )
}

function MobileFrameLoop() {
  const advance = useThree((state) => state.advance)
  useEffect(() => {
    let frame = 0
    let lastFrameTime = 0
    const tick = (time: number) => {
      if (time - lastFrameTime >= 32) {
        advance(time)
        lastFrameTime = time
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [advance])
  return null
}

function HeroWorld({ fractureProgressRef, isMobile }: Omit<HeroSceneProps, 'showStats'>) {
  return (
    <>
      <color attach="background" args={['#FAF8F4']} />
      <fog attach="fog" args={['#FAF8F4', 9, 23]} />
      <ambientLight intensity={0.52} />
      <directionalLight color="#FFE8B2" intensity={1.85} position={[6.5, 6.8, 6.2]} />
      <directionalLight color="#DCE5EB" intensity={0.45} position={[-5, 2, 4]} />
      <SoftEnvironment />
      <Wings fractureProgressRef={fractureProgressRef} />
      <CloudLayers />
      <Dust />
      <CameraRig fractureProgressRef={fractureProgressRef} />
      <PostProcessing isMobile={isMobile} />
      {isMobile && <MobileFrameLoop />}
    </>
  )
}

export function HeroScene({
  fractureProgressRef,
  isMobile,
  showStats = false,
}: HeroSceneProps) {
  return (
    <Canvas
      dpr={isMobile ? [1, 1.05] : [1, 1.15]}
      camera={{ position: [0, 0.36, 12.2], fov: 40, near: 0.1, far: 60 }}
      frameloop={isMobile ? 'never' : 'always'}
      gl={{ antialias: !isMobile, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.78
      }}
    >
      <Suspense fallback={null}>
        <HeroWorld fractureProgressRef={fractureProgressRef} isMobile={isMobile} />
      </Suspense>
      {showStats && <Stats className="fps-stats" showPanel={0} />}
    </Canvas>
  )
}

useGLTF.preload(modelPath, dracoPath, true)

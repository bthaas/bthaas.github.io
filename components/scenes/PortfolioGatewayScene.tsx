'use client'

import { Stats } from '@react-three/drei/core/Stats.js'
import { useGLTF } from '@react-three/drei/core/Gltf.js'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'

import { GATEWAY_CATEGORIES } from '@/lib/portfolio-gateway'

interface PortfolioGatewaySceneProps {
  readonly activeIndex: number
  readonly isConstrained: boolean
  readonly onReady: () => void
  readonly pointerRef: RefObject<{ x: number; y: number }>
  readonly rotationDegrees: number
  readonly showStats: boolean
}

const modelPath = '/models/portfolio-gateway.glb'
const dracoPath = '/draco/'
const panelNames = [
  'carousel_experience_panel',
  'carousel_projects_panel',
  'carousel_skills_panel',
] as const

function GatewayModel({
  activeIndex,
  isConstrained,
  onReady,
  pointerRef,
  rotationDegrees,
}: Omit<PortfolioGatewaySceneProps, 'showStats'>) {
  const groupRef = useRef<THREE.Group>(null)
  const readyRef = useRef(false)
  const { scene } = useGLTF(modelPath, dracoPath, true)
  const textures = useLoader(
    THREE.TextureLoader,
    GATEWAY_CATEGORIES.map(({ image }) => image),
  )
  const { gl, invalidate } = useThree()
  const setup = useMemo(() => {
    const model = scene.clone(true)
    const panelMaterials = textures.map((texture) => new THREE.MeshPhysicalMaterial({
      clearcoat: 0.18,
      clearcoatRoughness: 0.32,
      map: texture,
      metalness: 0,
      roughness: 0.42,
      side: THREE.DoubleSide,
    }))
    const reflectionTextures = textures.map((texture) => {
      const reflection = texture.clone()
      reflection.colorSpace = THREE.SRGBColorSpace
      reflection.flipY = false
      reflection.wrapT = THREE.RepeatWrapping
      reflection.repeat.set(1, -1)
      reflection.offset.set(0, 1)
      reflection.needsUpdate = true
      return reflection
    })
    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: '#f5f2ec',
      map: reflectionTextures[0],
      metalness: 0,
      opacity: 0.24,
      roughness: 0.3,
      side: THREE.DoubleSide,
      transparent: true,
    })

    panelNames.forEach((name, index) => {
      const panel = model.getObjectByName(name)
      if (!(panel instanceof THREE.Mesh)) throw new Error(`Missing gateway node: ${name}`)
      panel.material = panelMaterials[index]
    })
    const shell = model.getObjectByName('carousel_reflector_shell')
    if (!(shell instanceof THREE.Mesh)) throw new Error('Missing gateway reflector shell')
    shell.material = shellMaterial

    return { model, panelMaterials, reflectionTextures, shellMaterial }
  }, [scene, textures])

  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
      texture.needsUpdate = true
    })
    invalidate()
  }, [gl, invalidate, textures])

  useEffect(() => {
    setup.shellMaterial.map = setup.reflectionTextures[activeIndex]
    setup.shellMaterial.needsUpdate = true
    invalidate()
  }, [activeIndex, invalidate, setup])

  useEffect(() => () => {
    setup.panelMaterials.forEach((material) => material.dispose())
    setup.reflectionTextures.forEach((texture) => texture.dispose())
    setup.shellMaterial.dispose()
  }, [setup])

  useEffect(() => {
    const interval = window.setInterval(invalidate, isConstrained ? 33 : 16)
    return () => window.clearInterval(interval)
  }, [invalidate, isConstrained])

  useFrame(({ clock }, delta) => {
    const group = groupRef.current
    if (!group) return
    const targetRotation = THREE.MathUtils.degToRad(rotationDegrees)
    const pointerYaw = isConstrained ? 0 : pointerRef.current.x * 0.035
    const pointerPitch = isConstrained ? 0 : -pointerRef.current.y * 0.018
    group.rotation.y = THREE.MathUtils.damp(
      group.rotation.y,
      targetRotation + pointerYaw + Math.sin(clock.elapsedTime * 0.42) * 0.006,
      5.8,
      delta,
    )
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pointerPitch, 5.2, delta)
    if (!readyRef.current) {
      readyRef.current = true
      onReady()
    }
  })

  return (
    <group ref={groupRef} position={[0, 0.85, 0]}>
      <primitive object={setup.model} />
    </group>
  )
}

export function PortfolioGatewayScene(props: PortfolioGatewaySceneProps) {
  return (
    <Canvas
      camera={{ fov: 38, position: [0, 0.18, 6.2] }}
      dpr={props.isConstrained ? 1 : [1, 1.5]}
      frameloop="demand"
      gl={{ alpha: true, antialias: !props.isConstrained, powerPreference: 'high-performance' }}
      className="portfolio-gateway-canvas"
      resize={{ offsetSize: true }}
    >
      <ambientLight intensity={1.75} />
      <directionalLight color="#ffe3b2" intensity={2.4} position={[4.8, 5.5, 5.2]} />
      <directionalLight color="#b9d8ef" intensity={0.8} position={[-4, -1.4, 4]} />
      <GatewayModel {...props} />
      {props.showStats && <Stats className="portfolio-gateway__stats" />}
    </Canvas>
  )
}

useGLTF.preload(modelPath, dracoPath, true)

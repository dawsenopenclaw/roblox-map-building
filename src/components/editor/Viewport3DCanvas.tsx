'use client'

/**
 * Viewport3DCanvas — the actual R3F canvas. Split from Viewport3D so that
 * the heavy Three.js bundle is loaded only on the client via dynamic import.
 */

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Grid, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { ParsedPart } from '@/lib/luau-parser'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GOLD = '#D4AF37'
const GLOW_DURATION = 1200   // ms — golden glow lifetime
const STAGGER_MS = 50         // ms between each part appearing
const SPRING_DURATION = 0.55  // seconds — scale spring length

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AnimatedPart {
  part: ParsedPart
  addedAt: number   // Date.now() when this part was added to the scene
}

// ---------------------------------------------------------------------------
// Camera auto-fit helper
// ---------------------------------------------------------------------------
function computeSceneBounds(parts: ParsedPart[]): THREE.Box3 {
  const box = new THREE.Box3()
  for (const p of parts) {
    const [px, py, pz] = p.position
    const [sx, sy, sz] = p.size
    box.expandByPoint(new THREE.Vector3(px - sx / 2, py - sy / 2, pz - sz / 2))
    box.expandByPoint(new THREE.Vector3(px + sx / 2, py + sy / 2, pz + sz / 2))
  }
  return box
}

// ---------------------------------------------------------------------------
// CameraRig — auto-orbits to fit bounding box when parts change
// ---------------------------------------------------------------------------
function CameraRig({ parts }: { parts: ParsedPart[] }) {
  const { camera } = useThree()
  const controlsRef = useRef<ReturnType<typeof OrbitControls> | null>(null)
  const lastCountRef = useRef(0)

  useEffect(() => {
    if (parts.length === 0) {
      camera.position.set(8, 6, 10)
      camera.lookAt(0, 0, 0)
      return
    }
    if (parts.length === lastCountRef.current) return
    lastCountRef.current = parts.length

    const box = computeSceneBounds(parts)
    if (box.isEmpty()) return

    const center = new THREE.Vector3()
    box.getCenter(center)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = (camera as THREE.PerspectiveCamera).fov ?? 50
    const fovRad = (fov * Math.PI) / 180
    const dist = (maxDim / 2) / Math.tan(fovRad / 2) * 1.8

    const angle = Math.PI / 5   // ~36 degrees elevation
    camera.position.set(
      center.x + dist * Math.sin(Math.PI / 4),
      center.y + dist * Math.sin(angle),
      center.z + dist * Math.cos(Math.PI / 4),
    )
    camera.lookAt(center)
    // @ts-expect-error — OrbitControls target is writable
    if (controlsRef.current?.target) {
      // @ts-expect-error
      controlsRef.current.target.copy(center)
      // @ts-expect-error
      controlsRef.current.update?.()
    }
  }, [parts, camera])

  return (
    <OrbitControls
      // @ts-expect-error — ref typing mismatch between R3F and drei versions
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1}
      maxDistance={500}
      maxPolarAngle={Math.PI * 0.9}
    />
  )
}

// ---------------------------------------------------------------------------
// Ground grid plane
// ---------------------------------------------------------------------------
function GroundGrid({ parts }: { parts: ParsedPart[] }) {
  const size = useMemo(() => {
    if (parts.length === 0) return 20
    const box = computeSceneBounds(parts)
    if (box.isEmpty()) return 20
    const s = new THREE.Vector3()
    box.getSize(s)
    return Math.max(20, Math.ceil(Math.max(s.x, s.z) * 1.5))
  }, [parts])

  return (
    <Grid
      args={[size, size]}
      cellSize={1}
      cellThickness={0.4}
      cellColor="#1a2a3a"
      sectionSize={5}
      sectionThickness={0.8}
      sectionColor="#243040"
      fadeDistance={120}
      fadeStrength={1}
      infiniteGrid
      position={[0, -0.01, 0]}
    />
  )
}

// ---------------------------------------------------------------------------
// Part geometry selector
// ---------------------------------------------------------------------------
function PartGeometry({ partType }: { partType: ParsedPart['partType'] }) {
  switch (partType) {
    case 'WedgePart':
      // Approximate a wedge with a 3-sided prism: use CylinderGeometry with 3 segments,
      // rotated so the flat face is down
      return <cylinderGeometry args={[0, 0.7, 1, 3, 1]} />
    case 'CylinderPart':
      return <cylinderGeometry args={[0.5, 0.5, 1, 16, 1]} />
    case 'SpherePart':
      return <sphereGeometry args={[0.5, 24, 16]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

// ---------------------------------------------------------------------------
// PartMesh — a single animated part
// ---------------------------------------------------------------------------
interface PartMeshProps {
  part: ParsedPart
  addedAt: number
  index: number
}

function PartMesh({ part, addedAt, index }: PartMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)

  // Staggered appearance: this part starts animating after index * STAGGER_MS
  const startTime = useRef(addedAt + index * STAGGER_MS)
  const [visible, setVisible] = useState(false)

  // Reveal after stagger delay
  useEffect(() => {
    const delay = index * STAGGER_MS
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [index])

  const [px, py, pz] = part.position
  const [sx, sy, sz] = part.size
  const [rx, ry, rz] = part.rotation
  const { materialProps } = part

  // Scale the geometry to the part size
  const scale: [number, number, number] = useMemo(() => {
    switch (part.partType) {
      case 'WedgePart':
        return [sx, sy, sz]
      case 'CylinderPart':
        return [sx * 2, sy, sz * 2]
      case 'SpherePart':
        return [sx * 2, sy * 2, sz * 2]
      default:
        return [sx, sy, sz]
    }
  }, [part.partType, sx, sy, sz])

  // Spring animation — scale from 0 to 1 on appearance, glow fade
  useFrame((_, delta) => {
    if (!meshRef.current || !visible) return

    const now = Date.now()
    const elapsed = now - startTime.current
    const t = Math.min(elapsed / (SPRING_DURATION * 1000), 1)

    // Spring easing: overshoots slightly then settles
    const springT = springEase(t)
    meshRef.current.scale.setScalar(springT)

    // Glow fades after GLOW_DURATION ms
    if (glowRef.current) {
      const glowT = Math.max(0, 1 - elapsed / GLOW_DURATION)
      glowRef.current.intensity = glowT * 2.5
    }
  })

  if (!visible) return null

  return (
    <mesh
      ref={meshRef}
      position={[px, py, pz]}
      rotation={[rx, ry, rz]}
      scale={[0, 0, 0]}   // starts at 0, animated in useFrame
      castShadow
      receiveShadow
    >
      {/* Geometry scaled to part size */}
      <group scale={scale}>
        <PartGeometry partType={part.partType} />
      </group>

      <meshStandardMaterial
        color={materialProps.color}
        roughness={materialProps.roughness}
        metalness={materialProps.metalness}
        opacity={materialProps.opacity}
        transparent={materialProps.transparent}
        emissive={materialProps.emissive ?? '#000000'}
        emissiveIntensity={materialProps.emissiveIntensity}
        side={THREE.FrontSide}
      />

      {/* Golden glow point light on new parts */}
      <pointLight
        ref={glowRef}
        color={GOLD}
        intensity={2.5}
        distance={Math.max(sx, sy, sz) * 4}
        decay={2}
      />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Spring easing — ease-out with slight overshoot
// ---------------------------------------------------------------------------
function springEase(t: number): number {
  // Approximate damped spring using a blend of ease-out and overshoot
  if (t >= 1) return 1
  const c4 = (2 * Math.PI) / 3
  return 1 - Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4)
}

// ---------------------------------------------------------------------------
// Scene — manages the list of animated parts
// ---------------------------------------------------------------------------
const Scene = memo(function Scene({
  parts,
  showGrid,
}: {
  parts: ParsedPart[]
  showGrid: boolean
}) {
  // Track when each part was "added" so we can stagger their animations.
  // Key: part.id → timestamp added
  const addedAtMap = useRef<Map<string, number>>(new Map())
  const prevIdsRef = useRef<Set<string>>(new Set())

  const now = Date.now()
  const newIds = new Set(parts.map(p => p.id))

  // Detect newly added parts
  for (const p of parts) {
    if (!prevIdsRef.current.has(p.id)) {
      addedAtMap.current.set(p.id, now)
    }
  }
  prevIdsRef.current = newIds

  // Count index within the current "batch" (all parts added at roughly the same time)
  // We group by addedAt bucket (within 500ms window)
  const batchBuckets = new Map<number, number>()  // bucket timestamp → count so far
  const partIndices = new Map<string, number>()
  for (const p of parts) {
    const addedAt = addedAtMap.current.get(p.id) ?? now
    const bucket = Math.floor(addedAt / 500) * 500
    const idx = batchBuckets.get(bucket) ?? 0
    batchBuckets.set(bucket, idx + 1)
    partIndices.set(p.id, idx)
  }

  return (
    <>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={500}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <directionalLight position={[-10, 20, -20]} intensity={0.3} color="#4080c0" />

      {/* HDRI for reflections */}
      <Environment preset="city" />

      {/* Grid */}
      {showGrid && <GroundGrid parts={parts} />}

      {/* Camera rig */}
      <CameraRig parts={parts} />

      {/* Parts */}
      {parts.map((part) => (
        <PartMesh
          key={part.id}
          part={part}
          addedAt={addedAtMap.current.get(part.id) ?? now}
          index={partIndices.get(part.id) ?? 0}
        />
      ))}

      {/* Empty state indicator */}
      {parts.length === 0 && <EmptySceneGuide />}
    </>
  )
})

// ---------------------------------------------------------------------------
// Empty scene guide
// ---------------------------------------------------------------------------
function EmptySceneGuide() {
  return (
    <>
      {/* A subtle platform in the center */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[10, 0.1, 10]} />
        <meshStandardMaterial color="#0f1a2a" roughness={0.9} metalness={0} />
      </mesh>
      {/* Origin marker */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 12]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.2} roughness={0.2} />
      </mesh>
    </>
  )
}

// ---------------------------------------------------------------------------
// Top-level canvas
// ---------------------------------------------------------------------------
export default function Viewport3DCanvas({
  parts,
  showGrid,
}: {
  parts: ParsedPart[]
  showGrid: boolean
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.1, far: 2000, position: [8, 6, 10] }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#080B16']} />
      <fog attach="fog" args={['#080B16', 80, 300]} />

      <Suspense fallback={null}>
        <Scene parts={parts} showGrid={showGrid} />
      </Suspense>
    </Canvas>
  )
}

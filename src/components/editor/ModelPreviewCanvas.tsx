'use client'

/**
 * ModelPreviewCanvas — the actual R3F canvas for GLB preview.
 * Dynamically imported from ModelPreview to avoid SSR issues.
 *
 * - Loads GLB via useGLTF from @react-three/drei
 * - Auto-rotate orbit, drag to rotate, scroll to zoom
 * - Grid floor, ambient + directional lights
 * - Auto-fits camera to model bounding box
 * - Reports load errors to parent via onError callback
 */

import { Suspense, useRef, useEffect, useState, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Grid } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three/addons/controls/OrbitControls.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CanvasProps {
  glbUrl: string
  thumbnailUrl?: string | null
  autoRotate?: boolean
  onError?: () => void
}

// ---------------------------------------------------------------------------
// Spinner (inside canvas layer — rendered as HTML overlay)
// ---------------------------------------------------------------------------

function LoadOverlay() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: '#080B16',
        zIndex: 5,
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: 'mpc-spin 0.9s linear infinite' }}
      >
        <style>{`@keyframes mpc-spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="12" cy="12" r="10" stroke="rgba(212,175,55,0.2)" strokeWidth="2.5"/>
        <path d="M12 2a10 10 0 0110 10" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
        Loading 3D model…
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Error overlay (shown inside canvas area)
// ---------------------------------------------------------------------------

function ErrorOverlay({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnailUrl}
        alt="3D model preview"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 5 }}
      />
    )
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: '#080B16',
        zIndex: 5,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.4 }}>
        <circle cx="10" cy="10" r="8.5" stroke="#ef4444" strokeWidth="1.5"/>
        <path d="M10 6v5M10 13v1" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: 9, color: 'rgba(239,68,68,0.6)', fontFamily: 'Inter, sans-serif' }}>
        Failed to load GLB
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Model — loads GLB and auto-fits camera
// ---------------------------------------------------------------------------

function Model({ url, onError }: { url: string; onError?: () => void }) {
  const { scene } = useGLTF(url) as { scene: THREE.Group }
  const { camera, controls } = useThree() as {
    camera: THREE.PerspectiveCamera
    controls: OrbitControlsImpl | null
  }
  const fittedRef = useRef(false)

  useEffect(() => {
    if (fittedRef.current) return
    fittedRef.current = true

    // Compute bounding box and auto-fit camera
    const box = new THREE.Box3().setFromObject(scene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    const maxDim = Math.max(size.x, size.y, size.z)
    const fov = camera.fov * (Math.PI / 180)
    const cameraZ = Math.abs(maxDim / Math.sin(fov / 2)) * 0.6

    camera.position.set(center.x + cameraZ * 0.6, center.y + cameraZ * 0.35, center.z + cameraZ * 0.6)
    camera.near = cameraZ / 100
    camera.far  = cameraZ * 10
    camera.updateProjectionMatrix()
    camera.lookAt(center)

    // Move orbit target to model center
    if (controls) {
      controls.target.copy(center)
    }

    // Center the model on Y=0 so it sits on the grid
    scene.position.y -= box.min.y
  }, [scene, camera, controls])

  return <primitive object={scene} />
}

// ---------------------------------------------------------------------------
// Auto-rotate group — wraps Model so rotation doesn't fight OrbitControls
// ---------------------------------------------------------------------------

function AutoRotate({ children, active }: { children: React.ReactNode; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const isDragging = useRef(false)
  const lastDrag = useRef(0)

  // Pause auto-rotate for 2s after user interaction
  useEffect(() => {
    const onDown = () => { isDragging.current = true }
    const onUp   = () => { isDragging.current = false; lastDrag.current = Date.now() }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup',   onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup',   onUp)
    }
  }, [])

  useFrame((_, delta) => {
    if (!active || !groupRef.current) return
    const resumeAfter = 2000 // ms
    if (isDragging.current) return
    if (Date.now() - lastDrag.current < resumeAfter) return
    groupRef.current.rotation.y += delta * 0.35
  })

  return <group ref={groupRef}>{children}</group>
}

// ---------------------------------------------------------------------------
// Scene error boundary hook — catches useGLTF errors
// ---------------------------------------------------------------------------

function ModelWithErrorBoundary({ url, onError }: { url: string; onError?: () => void }) {
  // useGLTF throws a promise (Suspense) or an Error; the ErrorBoundary below
  // catches the Error case and calls onError so the parent can show the fallback.
  return <Model url={url} onError={onError} />
}

// ---------------------------------------------------------------------------
// R3F error boundary — catches GLTF load failures inside the canvas
// ---------------------------------------------------------------------------

import React from 'react'

interface ErrorBoundaryState {
  failed: boolean
}

class GLBErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError?.()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export default function ModelPreviewCanvas({
  glbUrl,
  thumbnailUrl,
  autoRotate = true,
  onError,
}: CanvasProps) {
  const [loading, setLoading] = useState(true)
  const [failed,  setFailed]  = useState(false)

  const handleError = useCallback(() => {
    setFailed(true)
    setLoading(false)
    onError?.()
  }, [onError])

  const handleCreated = useCallback(() => {
    setLoading(false)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080B16' }}>
      {loading && !failed && <LoadOverlay />}
      {failed && <ErrorOverlay thumbnailUrl={thumbnailUrl} />}

      <Canvas
        camera={{ fov: 45, near: 0.01, far: 1000, position: [3, 2, 4] }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        onCreated={handleCreated}
        style={{ background: '#080B16' }}
      >
        {/* Lighting — warm ambient + key/fill directionals for PBR visibility */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          color="#fff8e8"
          castShadow={false}
        />
        <directionalLight
          position={[-4, 3, -4]}
          intensity={0.4}
          color="#d0e8ff"
        />

        {/* Grid floor */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#2a2a4a"
          fadeDistance={14}
          fadeStrength={1}
          infiniteGrid
        />

        {/* Controls — orbit + zoom, no pan by default */}
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.07}
          minDistance={0.3}
          maxDistance={50}
          maxPolarAngle={Math.PI * 0.85}
        />

        {/* Model with error boundary and Suspense */}
        <GLBErrorBoundary onError={handleError}>
          <Suspense fallback={null}>
            <AutoRotate active={autoRotate}>
              <ModelWithErrorBoundary url={glbUrl} onError={handleError} />
            </AutoRotate>
          </Suspense>
        </GLBErrorBoundary>
      </Canvas>
    </div>
  )
}

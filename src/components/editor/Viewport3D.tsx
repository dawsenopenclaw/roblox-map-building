'use client'

/**
 * Viewport3D — Three.js / React Three Fiber viewport that renders
 * ParsedPart objects from the Luau parser.
 *
 * Features:
 * - BoxGeometry for Parts
 * - ConeGeometry (wedge approximation) for WedgeParts
 * - CylinderGeometry for CylinderParts
 * - SphereGeometry for SphereParts
 * - PBR MeshStandardMaterial with per-material roughness / metalness
 * - Neon emissive glow
 * - Parts fade in one by one with spring scale animation (50ms stagger)
 * - Golden glow on newly added parts that fades after 1 s
 * - Camera auto-fits to bounding box on build change
 * - Orbit controls
 * - Ground grid
 */

import { Suspense, useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { ParsedPart } from '@/lib/luau-parser'
import type { ThreeEvent } from '@react-three/fiber'
import type { OrbitControls as OrbitControlsType } from 'three/addons/controls/OrbitControls.js'
import type * as THREE from 'three'

// Dynamically import the actual canvas — no SSR
const SceneCanvas = dynamic(() => import('./Viewport3DCanvas'), {
  ssr: false,
  loading: () => <ViewportSkeleton />,
})

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ViewportSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#080B16]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
        <span className="text-[11px] text-zinc-500">Loading 3D viewport…</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface Viewport3DProps {
  parts: ParsedPart[]
  showGrid?: boolean
  className?: string
}

export function Viewport3D({ parts, showGrid = true, className = '' }: Viewport3DProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Suspense fallback={<ViewportSkeleton />}>
        <SceneCanvas parts={parts} showGrid={showGrid} />
      </Suspense>
    </div>
  )
}

// Re-export types for convenience
export type { ParsedPart }

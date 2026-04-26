'use client'

/**
 * BuildPreview — Shows a compact breakdown of generated build code.
 *
 * Parses the Luau code and displays:
 * - Total part count
 * - Parts by shape (Part, WedgePart, Cylinder, Ball)
 * - Materials used
 * - Lights count
 * - Scripts count (if any)
 * - Estimated complexity rating
 *
 * Renders as a compact card inline in the chat after code generation.
 */

import { useMemo } from 'react'

interface BuildStats {
  totalParts: number
  shapes: { block: number; wedge: number; cylinder: number; ball: number }
  materials: Map<string, number>
  lights: number
  scripts: number
  models: number
  terrain: boolean
  loops: number
  complexity: 'simple' | 'medium' | 'complex' | 'massive'
}

function analyzeBuild(code: string): BuildStats {
  const stats: BuildStats = {
    totalParts: 0,
    shapes: { block: 0, wedge: 0, cylinder: 0, ball: 0 },
    materials: new Map(),
    lights: 0,
    scripts: 0,
    models: 0,
    terrain: false,
    loops: 0,
    complexity: 'simple',
  }

  // Count P() calls (block parts)
  const pCalls = code.match(/\bP\s*\(/g)
  stats.shapes.block = pCalls?.length ?? 0

  // Count W() calls (wedge parts)
  const wCalls = code.match(/\bW\s*\(/g)
  stats.shapes.wedge = wCalls?.length ?? 0

  // Count Cyl() calls
  const cylCalls = code.match(/\bCyl\s*\(/g)
  stats.shapes.cylinder = cylCalls?.length ?? 0

  // Count Ball() calls
  const ballCalls = code.match(/\bBall\s*\(/g)
  stats.shapes.ball = ballCalls?.length ?? 0

  // Count Instance.new("Part") etc
  const instanceParts = code.match(/Instance\.new\s*\(\s*["'](?:Part|WedgePart|TrussPart|CornerWedgePart)["']\s*\)/g)
  stats.shapes.block += instanceParts?.length ?? 0

  stats.totalParts = stats.shapes.block + stats.shapes.wedge + stats.shapes.cylinder + stats.shapes.ball

  // Count lights
  const lightCalls = code.match(/\bLight\s*\(|Instance\.new\s*\(\s*["'](?:PointLight|SpotLight|SurfaceLight)["']\s*\)/g)
  stats.lights = lightCalls?.length ?? 0

  // Count scripts
  const scriptCalls = code.match(/Instance\.new\s*\(\s*["'](?:Script|LocalScript|ModuleScript)["']\s*\)/g)
  stats.scripts = scriptCalls?.length ?? 0

  // Count models
  const modelCalls = code.match(/Instance\.new\s*\(\s*["']Model["']\s*\)/g)
  stats.models = modelCalls?.length ?? 0

  // Check terrain
  stats.terrain = /workspace\.Terrain|:FillBlock|:FillBall/.test(code)

  // Count loops (estimating additional parts from loops)
  const forLoops = code.match(/\bfor\b/g)
  stats.loops = forLoops?.length ?? 0
  // Estimate: each loop adds ~5-20 parts on average
  if (stats.loops > 0) {
    stats.totalParts += stats.loops * 8
  }

  // Extract materials
  const matMatches = code.matchAll(/["'](\w+)["']\s*(?:,\s*\d)/g)
  for (const m of matMatches) {
    const mat = m[1]
    if (['Concrete', 'Brick', 'Wood', 'WoodPlanks', 'Metal', 'Glass', 'Slate', 'Granite',
         'Marble', 'Cobblestone', 'Neon', 'Fabric', 'Rock', 'Sand', 'Grass', 'DiamondPlate',
         'LeafyGrass', 'Ground'].includes(mat)) {
      stats.materials.set(mat, (stats.materials.get(mat) ?? 0) + 1)
    }
  }

  // Also check Enum.Material[] references
  const enumMats = code.matchAll(/Enum\.Material\[["'](\w+)["']\]|Enum\.Material\.(\w+)/g)
  for (const m of enumMats) {
    const mat = m[1] || m[2]
    if (mat && mat !== 'SmoothPlastic') {
      stats.materials.set(mat, (stats.materials.get(mat) ?? 0) + 1)
    }
  }

  // Complexity rating
  if (stats.totalParts >= 200 || stats.scripts >= 3) stats.complexity = 'massive'
  else if (stats.totalParts >= 80 || stats.scripts >= 1) stats.complexity = 'complex'
  else if (stats.totalParts >= 30) stats.complexity = 'medium'
  else stats.complexity = 'simple'

  return stats
}

const COMPLEXITY_COLORS = {
  simple: 'text-green-400',
  medium: 'text-yellow-400',
  complex: 'text-orange-400',
  massive: 'text-red-400',
}

const COMPLEXITY_BG = {
  simple: 'bg-green-400/10',
  medium: 'bg-yellow-400/10',
  complex: 'bg-orange-400/10',
  massive: 'bg-red-400/10',
}

export default function BuildPreview({ code }: { code: string }) {
  const stats = useMemo(() => analyzeBuild(code), [code])

  if (stats.totalParts === 0) return null

  const topMaterials = [...stats.materials.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3 mt-2 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-white/70">Build Preview</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${COMPLEXITY_COLORS[stats.complexity]} ${COMPLEXITY_BG[stats.complexity]}`}>
          {stats.complexity}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-white/50">
        <div className="flex justify-between">
          <span>Total parts</span>
          <span className="text-white/80 font-mono">{stats.totalParts}~</span>
        </div>
        {stats.shapes.block > 0 && (
          <div className="flex justify-between">
            <span>Blocks</span>
            <span className="text-white/80 font-mono">{stats.shapes.block}</span>
          </div>
        )}
        {stats.shapes.wedge > 0 && (
          <div className="flex justify-between">
            <span>Wedges</span>
            <span className="text-white/80 font-mono">{stats.shapes.wedge}</span>
          </div>
        )}
        {stats.shapes.cylinder > 0 && (
          <div className="flex justify-between">
            <span>Cylinders</span>
            <span className="text-white/80 font-mono">{stats.shapes.cylinder}</span>
          </div>
        )}
        {stats.shapes.ball > 0 && (
          <div className="flex justify-between">
            <span>Balls</span>
            <span className="text-white/80 font-mono">{stats.shapes.ball}</span>
          </div>
        )}
        {stats.lights > 0 && (
          <div className="flex justify-between">
            <span>Lights</span>
            <span className="text-white/80 font-mono">{stats.lights}</span>
          </div>
        )}
        {stats.scripts > 0 && (
          <div className="flex justify-between">
            <span>Scripts</span>
            <span className="text-white/80 font-mono">{stats.scripts}</span>
          </div>
        )}
        {stats.terrain && (
          <div className="flex justify-between">
            <span>Terrain</span>
            <span className="text-green-400 font-mono">yes</span>
          </div>
        )}
        {stats.loops > 0 && (
          <div className="flex justify-between">
            <span>Loops</span>
            <span className="text-white/80 font-mono">{stats.loops}</span>
          </div>
        )}
      </div>

      {topMaterials.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {topMaterials.map(([mat, count]) => (
            <span key={mat} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-white/40">
              {mat} ({count})
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

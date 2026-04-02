'use client'

import React, { useRef, useEffect, memo } from 'react'
import type { ParsedPart } from '@/lib/luau-parser'

/**
 * BuildPreviewMini — lightweight isometric canvas thumbnail of a build.
 * Renders parsed Luau parts as colored boxes from an isometric camera angle.
 * No Three.js needed — pure 2D Canvas. Designed to appear inline in chat
 * messages as a visual preview of what the AI built.
 *
 * Usage: <BuildPreviewMini parts={parsedParts} width={240} height={160} />
 */

interface BuildPreviewMiniProps {
  parts: ParsedPart[]
  width?: number
  height?: number
}

// Isometric projection: 3D → 2D with a ~30 degree angle
function isoProject(
  x: number,
  y: number,
  z: number,
  scale: number,
  cx: number,
  cy: number,
): [number, number] {
  const isoX = (x - z) * 0.866 * scale + cx
  const isoY = (x + z) * 0.5 * scale - y * scale + cy
  return [isoX, isoY]
}

function renderPreview(
  ctx: CanvasRenderingContext2D,
  parts: ParsedPart[],
  w: number,
  h: number,
  dpr: number,
) {
  const cw = w * dpr
  const ch = h * dpr
  ctx.clearRect(0, 0, cw, ch)

  if (parts.length === 0) return

  // Find bounding box center
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity
  let minZ = Infinity, maxZ = -Infinity

  for (const p of parts) {
    const [px, py, pz] = p.position
    const [sx, sy, sz] = p.size
    minX = Math.min(minX, px - sx / 2); maxX = Math.max(maxX, px + sx / 2)
    minY = Math.min(minY, py - sy / 2); maxY = Math.max(maxY, py + sy / 2)
    minZ = Math.min(minZ, pz - sz / 2); maxZ = Math.max(maxZ, pz + sz / 2)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const centerZ = (minZ + maxZ) / 2
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const rangeZ = maxZ - minZ || 1
  const maxRange = Math.max(rangeX, rangeY, rangeZ)

  // Scale to fit canvas with padding
  const scale = Math.min(cw, ch) * 0.35 / maxRange
  const screenCx = cw / 2
  const screenCy = ch / 2 + maxRange * scale * 0.1

  // Sort parts by depth (back to front for painter's algorithm)
  const sorted = [...parts].sort((a, b) => {
    const da = a.position[0] + a.position[2] - a.position[1]
    const db = b.position[0] + b.position[2] - b.position[1]
    return da - db
  })

  for (const part of sorted) {
    const [px, py, pz] = part.position
    const [sx, sy, sz] = part.size
    const rx = px - centerX
    const ry = py - centerY
    const rz = pz - centerZ

    const [r, g, b] = part.color
    const baseColor = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`

    // Draw 3 visible faces of the box (top, left, right)
    const hw = sx / 2, hh = sy / 2, hd = sz / 2

    // 8 corners of the box
    const corners = [
      [rx - hw, ry - hh, rz - hd], // 0: back-bottom-left
      [rx + hw, ry - hh, rz - hd], // 1: back-bottom-right
      [rx + hw, ry - hh, rz + hd], // 2: front-bottom-right
      [rx - hw, ry - hh, rz + hd], // 3: front-bottom-left
      [rx - hw, ry + hh, rz - hd], // 4: back-top-left
      [rx + hw, ry + hh, rz - hd], // 5: back-top-right
      [rx + hw, ry + hh, rz + hd], // 6: front-top-right
      [rx - hw, ry + hh, rz + hd], // 7: front-top-left
    ] as const

    const pts = corners.map(([cx, cy, cz]) =>
      isoProject(cx, cy, cz, scale, screenCx, screenCy)
    )

    // Top face (lighter)
    ctx.beginPath()
    ctx.moveTo(pts[4][0], pts[4][1])
    ctx.lineTo(pts[5][0], pts[5][1])
    ctx.lineTo(pts[6][0], pts[6][1])
    ctx.lineTo(pts[7][0], pts[7][1])
    ctx.closePath()
    ctx.fillStyle = adjustBrightness(r, g, b, 1.3)
    ctx.fill()

    // Left face (medium)
    ctx.beginPath()
    ctx.moveTo(pts[3][0], pts[3][1])
    ctx.lineTo(pts[7][0], pts[7][1])
    ctx.lineTo(pts[6][0], pts[6][1])
    ctx.lineTo(pts[2][0], pts[2][1])
    ctx.closePath()
    ctx.fillStyle = adjustBrightness(r, g, b, 0.9)
    ctx.fill()

    // Right face (darker)
    ctx.beginPath()
    ctx.moveTo(pts[2][0], pts[2][1])
    ctx.lineTo(pts[6][0], pts[6][1])
    ctx.lineTo(pts[5][0], pts[5][1])
    ctx.lineTo(pts[1][0], pts[1][1])
    ctx.closePath()
    ctx.fillStyle = adjustBrightness(r, g, b, 0.65)
    ctx.fill()

    // Edge lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'
    ctx.lineWidth = dpr * 0.5
    for (const face of [
      [4, 5, 6, 7],
      [3, 7, 6, 2],
      [2, 6, 5, 1],
    ]) {
      ctx.beginPath()
      ctx.moveTo(pts[face[0]][0], pts[face[0]][1])
      for (let i = 1; i < face.length; i++) {
        ctx.lineTo(pts[face[i]][0], pts[face[i]][1])
      }
      ctx.closePath()
      ctx.stroke()
    }
  }

  // Part count label
  ctx.font = `${10 * dpr}px Inter, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.textAlign = 'right'
  ctx.fillText(`${parts.length} parts`, cw - 8 * dpr, ch - 6 * dpr)
}

function adjustBrightness(r: number, g: number, b: number, factor: number): string {
  return `rgb(${Math.min(255, Math.round(r * 255 * factor))},${Math.min(255, Math.round(g * 255 * factor))},${Math.min(255, Math.round(b * 255 * factor))})`
}

export const BuildPreviewMini = memo(function BuildPreviewMini({
  parts,
  width = 240,
  height = 160,
}: BuildPreviewMiniProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || parts.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    renderPreview(ctx, parts, width, height, dpr)
  }, [parts, width, height])

  if (parts.length === 0) return null

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height, display: 'block' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 6px',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.6)',
          fontSize: 9,
          color: 'rgba(255,184,28,0.8)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="0.8"/>
          <path d="M3 1v2h2V1" stroke="currentColor" strokeWidth="0.6"/>
        </svg>
        BUILD PREVIEW
      </div>
    </div>
  )
})

'use client'

import { useEffect, useRef } from 'react'

/**
 * Deep space background with soft nebula glows and a gentle cursor light.
 * Minimal. No particles, no trails, no noise. Just depth and warmth.
 */
export function GlassOrbEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const targetRef = useRef({ x: -9999, y: -9999 })
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0, h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseLeave = () => {
      targetRef.current = { x: -9999, y: -9999 }
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)

    const loop = () => {
      // Smooth follow — cursor glow eases toward mouse position
      const lerp = 0.08
      if (targetRef.current.x > -999) {
        mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * lerp
        mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * lerp
      } else {
        mouseRef.current.x += (-9999 - mouseRef.current.x) * 0.05
        mouseRef.current.y += (-9999 - mouseRef.current.y) * 0.05
      }

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      ctx.clearRect(0, 0, w, h)

      // ── Cursor glow — soft warm light that follows smoothly ──
      if (mx > -999) {
        // Outer ambient — very wide, very soft
        const outer = ctx.createRadialGradient(mx, my, 0, mx, my, 400)
        outer.addColorStop(0, 'rgba(212, 175, 55, 0.04)')
        outer.addColorStop(0.4, 'rgba(212, 175, 55, 0.015)')
        outer.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = outer
        ctx.beginPath()
        ctx.arc(mx, my, 400, 0, Math.PI * 2)
        ctx.fill()

        // Inner warmth
        const inner = ctx.createRadialGradient(mx, my, 0, mx, my, 120)
        inner.addColorStop(0, 'rgba(255, 220, 130, 0.07)')
        inner.addColorStop(0.5, 'rgba(255, 195, 60, 0.025)')
        inner.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = inner
        ctx.beginPath()
        ctx.arc(mx, my, 120, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  opacitySpeed: number
  opacityDir: number
}

interface ParticleBackgroundProps {
  className?: string
  /** Number of particles. Default 55. */
  count?: number
  /** Particle color. Default gold. */
  color?: string
  /** Max particle opacity. Default 0.35. */
  maxOpacity?: number
  /** Max particle drift speed (px/frame). Default 0.25. */
  speed?: number
}

/**
 * Canvas-based floating particle background.
 * Gold dots, slow drift, low opacity. Respects prefers-reduced-motion by rendering nothing.
 */
export function ParticleBackground({
  className = '',
  count = 55,
  color = '#FFB81C',
  maxOpacity = 0.35,
  speed = 0.25,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let width = 0
    let height = 0

    function resize() {
      if (!canvas) return
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
    }

    function createParticles() {
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed - speed * 0.3,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * maxOpacity,
        opacitySpeed: 0.003 + Math.random() * 0.004,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
      }))
    }

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        // Update
        p.x += p.vx
        p.y += p.vy
        p.opacity += p.opacitySpeed * p.opacityDir
        if (p.opacity >= maxOpacity) { p.opacityDir = -1 }
        if (p.opacity <= 0.03) { p.opacityDir = 1 }

        // Wrap around
        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        // Parse hex to rgba
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        ctx.fillStyle = `rgba(${r},${g},${b},${p.opacity})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    rafRef.current = requestAnimationFrame(draw)

    const ro = new ResizeObserver(() => {
      resize()
      createParticles()
    })
    ro.observe(canvas)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [color, count, maxOpacity, speed])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  )
}

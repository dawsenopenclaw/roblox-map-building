'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  rotationSpeed: number
  shape: 'rect' | 'circle'
  alpha: number
  decay: number
}

const COLORS = [
  '#FFB81C', // gold
  '#FFF',    // white
  '#A78BFA', // violet
  '#34D399', // emerald
  '#F87171', // red
  '#60A5FA', // blue
]

function createParticle(canvasWidth: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: -10,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: Math.random() * 8 + 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
    alpha: 1,
    decay: Math.random() * 0.005 + 0.003,
  }
}

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const spawnCountRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const MAX_SPAWN = 220
    const SPAWN_RATE = 8 // particles per frame for first 30 frames

    let frame = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Spawn burst
      if (spawnCountRef.current < MAX_SPAWN && frame < 30) {
        for (let i = 0; i < SPAWN_RATE; i++) {
          particlesRef.current.push(createParticle(canvas.width))
          spawnCountRef.current++
        }
      }

      // Update + draw
      particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.01)

      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08 // gravity
        p.rotation += p.rotationSpeed
        p.alpha -= p.decay

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        }

        ctx.restore()
      }

      frame++

      if (particlesRef.current.length > 0 || frame < 35) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  )
}

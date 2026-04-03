'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * GlassOrbEffect — Large, vivid floating orbs that drift behind the entire site.
 * The site content sits on frosted glass panels above them.
 * Cursor beams a warm light with flowing particle trails.
 * Clicks produce satisfying glass-tap ripples.
 */
export function GlassOrbEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const prevMouseRef = useRef({ x: -9999, y: -9999 })
  const trailRef = useRef<{ x: number; y: number; alpha: number; radius: number; vx: number; vy: number }[]>([])
  const clickRipplesRef = useRef<{ x: number; y: number; radius: number; alpha: number; maxRadius: number }[]>([])
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const scrollRef = useRef(0)

  const orbsRef = useRef<{
    x: number; y: number; baseY: number; vx: number; vy: number
    radius: number; hue: number; sat: number; light: number; phase: number; speed: number
  }[]>([])

  const initOrbs = useCallback((w: number, docH: number) => {
    const orbs = []
    // Big visible orbs spread across the entire document height
    const count = Math.max(12, Math.floor((w * docH) / 250000))
    for (let i = 0; i < count; i++) {
      const hueBase = Math.random()
      // Mix of gold, warm amber, soft blue, and occasional violet
      let hue: number, sat: number, light: number
      if (hueBase < 0.45) {
        // Gold/amber family
        hue = 30 + Math.random() * 35
        sat = 70 + Math.random() * 25
        light = 50 + Math.random() * 15
      } else if (hueBase < 0.75) {
        // Cool blue
        hue = 210 + Math.random() * 30
        sat = 50 + Math.random() * 30
        light = 40 + Math.random() * 20
      } else {
        // Soft violet/pink
        hue = 260 + Math.random() * 40
        sat = 40 + Math.random() * 30
        light = 40 + Math.random() * 20
      }

      const baseY = Math.random() * docH
      orbs.push({
        x: Math.random() * w,
        y: baseY,
        baseY,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        radius: 150 + Math.random() * 350,
        hue, sat, light,
        phase: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.6,
      })
    }
    orbsRef.current = orbs
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let w = 0, h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5) // cap for performance
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const docH = Math.max(document.documentElement.scrollHeight, h * 5)
      if (orbsRef.current.length === 0) initOrbs(w, docH)
    }

    resize()
    window.addEventListener('resize', resize)

    const onScroll = () => { scrollRef.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onMouseMove = (e: MouseEvent) => {
      prevMouseRef.current = { ...mouseRef.current }
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const onClick = (e: MouseEvent) => {
      // Multi-ring ripple for glass feel
      for (let r = 0; r < 3; r++) {
        clickRipplesRef.current.push({
          x: e.clientX, y: e.clientY,
          radius: r * 8, alpha: 0.7 - r * 0.15,
          maxRadius: 140 + r * 60 + Math.random() * 40,
        })
      }
      // Burst particles
      const burstCount = 12
      for (let i = 0; i < burstCount; i++) {
        const angle = (Math.PI * 2 * i) / burstCount + (Math.random() - 0.5) * 0.3
        const speed = 1.5 + Math.random() * 2.5
        trailRef.current.push({
          x: e.clientX,
          y: e.clientY,
          alpha: 0.8 + Math.random() * 0.2,
          radius: 2 + Math.random() * 5,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        })
      }
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('click', onClick, { passive: true })

    // ─── Main render loop ───
    const loop = (ts: number) => {
      const dt = Math.min(ts - (timeRef.current || ts), 33)
      timeRef.current = ts
      const t = ts * 0.001
      const scroll = scrollRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      ctx.clearRect(0, 0, w, h)

      // ── 1. FLOATING ORBS ── (position in document space, render in viewport)
      for (const orb of orbsRef.current) {
        // Gentle physics
        orb.x += orb.vx + Math.sin(t * orb.speed * 0.4 + orb.phase) * 0.4
        orb.y += orb.vy + Math.cos(t * orb.speed * 0.3 + orb.phase) * 0.3

        // Soft wrap X
        if (orb.x < -orb.radius * 1.5) orb.x = w + orb.radius
        if (orb.x > w + orb.radius * 1.5) orb.x = -orb.radius

        // Convert to viewport Y
        const viewY = orb.y - scroll

        // Skip if not visible (with generous margin for large orbs)
        if (viewY < -orb.radius * 2 || viewY > h + orb.radius * 2) continue

        // Breathe animation
        const breathe = 1 + Math.sin(t * 0.6 + orb.phase) * 0.2
        const r = orb.radius * breathe

        // Mouse interaction — orbs swell and brighten near cursor
        const dx = mx - orb.x
        const dy = my - viewY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const proximity = dist < 600 ? (1 - dist / 600) : 0

        // Gentle attraction
        if (dist < 600 && dist > 0) {
          orb.vx += (dx / dist) * 0.008 * proximity
          orb.vy += (dy / dist) * 0.008 * proximity
        }
        orb.vx *= 0.997
        orb.vy *= 0.997

        // ── Draw the orb ──
        const alpha = 0.18 + proximity * 0.12
        const alphaEdge = 0.08 + proximity * 0.06
        const rScale = r + proximity * 40

        const grad = ctx.createRadialGradient(orb.x, viewY, 0, orb.x, viewY, rScale)
        grad.addColorStop(0, `hsla(${orb.hue}, ${orb.sat}%, ${orb.light + 10}%, ${alpha})`)
        grad.addColorStop(0.35, `hsla(${orb.hue}, ${orb.sat}%, ${orb.light}%, ${alphaEdge})`)
        grad.addColorStop(0.7, `hsla(${orb.hue}, ${orb.sat - 10}%, ${orb.light - 5}%, ${alphaEdge * 0.3})`)
        grad.addColorStop(1, `hsla(${orb.hue}, ${orb.sat}%, ${orb.light}%, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(orb.x, viewY, rScale, 0, Math.PI * 2)
        ctx.fill()

        // Inner bright core for larger orbs
        if (r > 180) {
          const coreGrad = ctx.createRadialGradient(orb.x, viewY, 0, orb.x, viewY, r * 0.3)
          coreGrad.addColorStop(0, `hsla(${orb.hue}, ${orb.sat + 10}%, ${orb.light + 20}%, ${0.08 + proximity * 0.1})`)
          coreGrad.addColorStop(1, `hsla(${orb.hue}, ${orb.sat}%, ${orb.light}%, 0)`)
          ctx.fillStyle = coreGrad
          ctx.beginPath()
          ctx.arc(orb.x, viewY, r * 0.3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── 2. CURSOR LIGHT BEAM ──
      if (mx > -999) {
        // Wide ambient glow
        const ambient = ctx.createRadialGradient(mx, my, 0, mx, my, 350)
        ambient.addColorStop(0, 'rgba(255, 210, 80, 0.10)')
        ambient.addColorStop(0.2, 'rgba(255, 184, 28, 0.06)')
        ambient.addColorStop(0.5, 'rgba(212, 175, 55, 0.025)')
        ambient.addColorStop(1, 'rgba(212, 175, 55, 0)')
        ctx.fillStyle = ambient
        ctx.beginPath()
        ctx.arc(mx, my, 350, 0, Math.PI * 2)
        ctx.fill()

        // Bright core
        const core = ctx.createRadialGradient(mx, my, 0, mx, my, 60)
        core.addColorStop(0, 'rgba(255, 240, 180, 0.18)')
        core.addColorStop(0.3, 'rgba(255, 210, 100, 0.08)')
        core.addColorStop(1, 'rgba(255, 184, 28, 0)')
        ctx.fillStyle = core
        ctx.beginPath()
        ctx.arc(mx, my, 60, 0, Math.PI * 2)
        ctx.fill()

        // Hot center point
        const hot = ctx.createRadialGradient(mx, my, 0, mx, my, 12)
        hot.addColorStop(0, 'rgba(255, 250, 220, 0.25)')
        hot.addColorStop(1, 'rgba(255, 230, 150, 0)')
        ctx.fillStyle = hot
        ctx.beginPath()
        ctx.arc(mx, my, 12, 0, Math.PI * 2)
        ctx.fill()

        // ── 3. FLOWING LIGHT TRAIL ──
        const speed = Math.sqrt(
          (mx - prevMouseRef.current.x) ** 2 + (my - prevMouseRef.current.y) ** 2
        )
        if (speed > 1.5) {
          const count = Math.min(Math.ceil(speed / 3), 6)
          for (let i = 0; i < count; i++) {
            const lerp = i / count
            const px = prevMouseRef.current.x + (mx - prevMouseRef.current.x) * lerp
            const py = prevMouseRef.current.y + (my - prevMouseRef.current.y) * lerp
            // Perpendicular scatter for width
            const perpX = -(my - prevMouseRef.current.y)
            const perpY = mx - prevMouseRef.current.x
            const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1
            const scatter = (Math.random() - 0.5) * 14
            trailRef.current.push({
              x: px + (perpX / perpLen) * scatter,
              y: py + (perpY / perpLen) * scatter,
              alpha: 0.6 + Math.random() * 0.3,
              radius: 1.5 + Math.random() * 4,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3 - 0.2, // slight upward drift
            })
          }
        }

        // Render trail particles
        for (let i = trailRef.current.length - 1; i >= 0; i--) {
          const p = trailRef.current[i]
          p.x += p.vx * (dt / 16)
          p.y += p.vy * (dt / 16)
          p.vy -= 0.01 * (dt / 16) // floats upward
          p.alpha -= 0.015 * (dt / 16)
          p.radius *= 0.997
          if (p.alpha <= 0) {
            trailRef.current.splice(i, 1)
            continue
          }
          const size = p.radius * 4
          const tGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size)
          tGrad.addColorStop(0, `rgba(255, 225, 120, ${p.alpha * 0.7})`)
          tGrad.addColorStop(0.3, `rgba(255, 200, 60, ${p.alpha * 0.3})`)
          tGrad.addColorStop(0.7, `rgba(255, 170, 30, ${p.alpha * 0.08})`)
          tGrad.addColorStop(1, `rgba(212, 150, 30, 0)`)
          ctx.fillStyle = tGrad
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        if (trailRef.current.length > 200) trailRef.current = trailRef.current.slice(-200)
      }

      // ── 4. CLICK RIPPLES (glass tap) ──
      for (let i = clickRipplesRef.current.length - 1; i >= 0; i--) {
        const rip = clickRipplesRef.current[i]
        rip.radius += (rip.maxRadius - rip.radius) * 0.06 * (dt / 16)
        rip.alpha -= 0.014 * (dt / 16)
        if (rip.alpha <= 0) { clickRipplesRef.current.splice(i, 1); continue }

        // Outer ring — gold
        ctx.strokeStyle = `rgba(255, 210, 100, ${rip.alpha * 0.4})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2)
        ctx.stroke()

        // Inner fill — very subtle warmth
        const ripGrad = ctx.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, rip.radius)
        ripGrad.addColorStop(0, `rgba(255, 220, 100, ${rip.alpha * 0.08})`)
        ripGrad.addColorStop(0.5, `rgba(255, 184, 28, ${rip.alpha * 0.03})`)
        ripGrad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = ripGrad
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2)
        ctx.fill()

        // Glass refraction ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.alpha * 0.1})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.arc(rip.x, rip.y, rip.radius * 0.7, 0, Math.PI * 2)
        ctx.stroke()
      }

      // ── 5. GLASS SURFACE HIGHLIGHTS ──
      // Faint horizontal caustic lines that slowly shift
      ctx.save()
      ctx.globalAlpha = 0.02 + Math.sin(t * 0.3) * 0.005
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 4; i++) {
        const yBase = h * (0.2 + i * 0.2)
        const yOff = Math.sin(t * 0.2 + i * 1.5) * 30
        ctx.beginPath()
        ctx.moveTo(0, yBase + yOff)
        ctx.bezierCurveTo(
          w * 0.25, yBase + yOff + 15 * Math.sin(t * 0.4 + i),
          w * 0.75, yBase + yOff - 15 * Math.cos(t * 0.35 + i),
          w, yBase + yOff
        )
        ctx.stroke()
      }
      ctx.restore()

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('click', onClick)
    }
  }, [initOrbs])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="glass-orb-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

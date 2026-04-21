'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

const AGENTS = [
  // Build (24) - inner ring, gold tint
  { name: 'Terrain Generator', desc: 'Mountains, rivers, biomes from text', cat: 'build', icon: '▲', color: '#10B981' },
  { name: 'City Builder', desc: 'Full city districts with roads & zoning', cat: 'build', icon: '🏙️', color: '#60A5FA' },
  { name: 'NPC Creator', desc: 'Patrol AI, dialogue trees, quest givers', cat: 'build', icon: '👤', color: '#F59E0B' },
  { name: 'Luau Script Writer', desc: 'Production Luau with security', cat: 'build', icon: '◆', color: '#818CF8' },
  { name: 'Combat System', desc: 'Hitbox, damage, combos, blocking', cat: 'build', icon: '⚔️', color: '#EF4444' },
  { name: 'Vehicle Builder', desc: 'Cars, boats, planes with physics', cat: 'build', icon: '🚗', color: '#F97316' },
  { name: 'Obby Architect', desc: 'Obstacle courses with checkpoints', cat: 'build', icon: '🏃', color: '#14B8A6' },
  { name: 'Tycoon Builder', desc: 'Droppers, conveyors, upgrades', cat: 'build', icon: '🏭', color: '#D4AF37' },
  { name: 'Horror Designer', desc: 'Jumpscares, dark lighting, chase AI', cat: 'build', icon: '👻', color: '#A855F7' },
  { name: 'Pet System', desc: 'Hatching, rarity tiers, evolution', cat: 'build', icon: '🐾', color: '#EC4899' },
  { name: 'Dungeon Generator', desc: 'Procedural rooms, traps, bosses', cat: 'build', icon: '🏰', color: '#6366F1' },
  { name: 'Simulator Engine', desc: 'Click mechanics, rebirths, worlds', cat: 'build', icon: '🔄', color: '#22D3EE' },
  { name: 'Tower Defense', desc: 'Paths, waves, tower placement', cat: 'build', icon: '🗼', color: '#84CC16' },
  { name: 'Mesh Generator', desc: '3D models from text prompts', cat: 'build', icon: '🧊', color: '#7C3AED' },
  { name: 'UI Designer', desc: 'HUDs, shops, inventories', cat: 'build', icon: '🖼️', color: '#0EA5E9' },
  { name: 'Particle FX Artist', desc: 'Fire, smoke, magic particles', cat: 'build', icon: '✨', color: '#F59E0B' },
  { name: 'Lighting Expert', desc: 'Atmosphere, PointLights, neon', cat: 'build', icon: '💡', color: '#FBBF24' },
  { name: 'Weather System', desc: 'Rain, snow, fog, day/night', cat: 'build', icon: '🌧️', color: '#64748B' },
  { name: 'Story Writer', desc: 'Narratives, cutscenes, choices', cat: 'build', icon: '📖', color: '#C084FC' },
  { name: 'Magic System', desc: 'Spells, mana, elements, cooldowns', cat: 'build', icon: '🔮', color: '#A78BFA' },
  { name: 'Boss Builder', desc: 'Attack patterns, phases, health', cat: 'build', icon: '🐉', color: '#DC2626' },
  { name: 'Crafting System', desc: 'Recipes, workbenches, materials', cat: 'build', icon: '🔨', color: '#B45309' },
  { name: 'Racing Track', desc: 'Tracks, laps, boost pads', cat: 'build', icon: '🏎️', color: '#059669' },
  { name: 'DataStore Manager', desc: 'Save systems, session lock', cat: 'build', icon: '💾', color: '#3B82F6' },
  // Analyze (6) - middle ring, blue tint
  { name: 'Performance Auditor', desc: 'FPS drops, memory leaks, lag', cat: 'analyze', icon: '📊', color: '#10B981' },
  { name: 'Code Reviewer', desc: 'Best practices, anti-patterns', cat: 'analyze', icon: '🔍', color: '#6366F1' },
  { name: 'Exploit Detector', desc: 'RemoteEvent abuse, speed hacks', cat: 'analyze', icon: '🛡️', color: '#EF4444' },
  { name: 'Game DNA Scanner', desc: 'Genre analysis, mechanics', cat: 'analyze', icon: '🧬', color: '#8B5CF6' },
  { name: 'Mobile Optimizer', desc: 'Touch controls, FPS, UI scale', cat: 'analyze', icon: '📱', color: '#0EA5E9' },
  { name: 'Retention Analyzer', desc: 'Session length, engagement', cat: 'analyze', icon: '📈', color: '#F59E0B' },
  // Optimize (4) - middle ring, blue tint
  { name: 'Render Optimizer', desc: 'Draw calls, LOD, streaming', cat: 'optimize', icon: '⚡', color: '#FBBF24' },
  { name: 'Network Optimizer', desc: 'Bandwidth, batching, replication', cat: 'optimize', icon: '🌐', color: '#22D3EE' },
  { name: 'Script Optimizer', desc: 'Loop perf, table pooling', cat: 'optimize', icon: '🚀', color: '#10B981' },
  { name: 'Part Count Optimizer', desc: 'Union, CSG, mesh replacement', cat: 'optimize', icon: '📐', color: '#F97316' },
  // Growth (6) - outer ring, green tint
  { name: 'Trend Finder', desc: 'Trending genres, viral hooks', cat: 'growth', icon: '🔥', color: '#EF4444' },
  { name: 'TikTok Advisor', desc: 'Viral clips, hooks, sounds', cat: 'growth', icon: '🎵', color: '#EC4899' },
  { name: 'YouTube Advisor', desc: 'Titles, thumbnails, strategy', cat: 'growth', icon: '▶️', color: '#DC2626' },
  { name: 'GamePass Advisor', desc: 'Pricing, bundles, conversion', cat: 'growth', icon: '💰', color: '#D4AF37' },
  { name: 'A/B Tester', desc: 'Feature flags, variants, metrics', cat: 'growth', icon: '🧪', color: '#7C3AED' },
  { name: 'Event Planner', desc: 'Seasonal updates, limited modes', cat: 'growth', icon: '🎉', color: '#F59E0B' },
]

const BUILD_AGENTS = AGENTS.filter(a => a.cat === 'build')
const ANALYZE_OPTIMIZE_AGENTS = AGENTS.filter(a => a.cat === 'analyze' || a.cat === 'optimize')
const GROWTH_AGENTS = AGENTS.filter(a => a.cat === 'growth')

const ALL_MOBILE_CATS = ['build', 'analyze', 'optimize', 'growth'] as const
type MobileCat = typeof ALL_MOBILE_CATS[number]

const CAT_LABELS: Record<MobileCat, string> = {
  build: 'Build',
  analyze: 'Analyze',
  optimize: 'Optimize',
  growth: 'Growth',
}

const CAT_COLORS: Record<MobileCat, string> = {
  build: '#D4AF37',
  analyze: '#60A5FA',
  optimize: '#60A5FA',
  growth: '#10B981',
}

interface Agent {
  name: string
  desc: string
  cat: string
  icon: string
  color: string
}

interface TooltipInfo {
  agent: Agent
  x: number
  y: number
}

interface RingNodeProps {
  agent: Agent
  angle: number
  radius: number
  ringIndex: number
  nodeIndex: number
  onHover: (info: TooltipInfo | null, nodeEl?: HTMLDivElement | null) => void
}

function RingNode({ agent, angle, radius, ringIndex, nodeIndex, onHover }: RingNodeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [ripple, setRipple] = useState(false)
  const rad = (angle * Math.PI) / 180
  const x = Math.cos(rad) * radius
  const y = Math.sin(rad) * radius

  // Deterministic space-drift timing — each node has unique multi-axis float
  const driftDuration = 6 + (nodeIndex % 7) * 1.2
  const driftDelay = (nodeIndex * 0.73) % 8
  // Each node gets a unique drift pattern via CSS custom properties
  const driftX = 3 + (nodeIndex % 4) * 1.5        // 3–7.5px lateral
  const driftY = 2 + ((nodeIndex * 3) % 5) * 1.2  // 2–6.8px vertical
  const driftRotate = 2 + (nodeIndex % 3) * 1.5   // 2–5deg gentle spin
  const driftScale = 0.97 + ((nodeIndex % 3) * 0.015) // subtle breathe

  const ringGlow =
    agent.cat === 'build'
      ? 'rgba(212,175,55,0.35)'
      : agent.cat === 'growth'
      ? 'rgba(16,185,129,0.35)'
      : 'rgba(96,165,250,0.35)'

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      onHover({ agent, x: rect.left + rect.width / 2, y: rect.top }, ref.current)
    }
    setRipple(false)
    // Trigger ripple with next tick so re-entering replays it
    requestAnimationFrame(() => setRipple(true))
  }

  const handleLeave = () => {
    onHover(null)
  }

  return (
    <div
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        zIndex: 10,
      }}
    >
      <motion.div
        whileHover={{ scale: 1.35 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{
          position: 'relative',
          animation: `spaceDrift ${driftDuration}s ease-in-out infinite`,
          animationDelay: `${driftDelay}s`,
          // @ts-expect-error CSS custom properties
          '--drift-x': `${driftX}px`,
          '--drift-y': `${driftY}px`,
          '--drift-rot': `${driftRotate}deg`,
          '--drift-scale': `${driftScale}`,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${agent.color}33 0%, #0a0e1a 100%)`,
          border: `1.5px solid ${agent.color}66`,
          boxShadow: `0 0 12px ${ringGlow}, 0 0 24px ${agent.color}15, inset 0 0 6px ${agent.color}22`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '15px',
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        <span style={{ pointerEvents: 'none' }}>{agent.icon}</span>

        {/* Ripple ring on hover */}
        {ripple && (
          <div
            key={Date.now()}
            onAnimationEnd={() => setRipple(false)}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: `1.5px solid ${agent.color}99`,
              animation: 'nodeRipple 0.6s ease-out forwards',
              pointerEvents: 'none',
            }}
          />
        )}
      </motion.div>
    </div>
  )
}

interface TooltipCardProps {
  info: TooltipInfo
}

function TooltipCard({ info }: TooltipCardProps) {
  const { agent, x, y } = info

  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y - 8,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          background: 'rgba(8, 12, 28, 0.97)',
          border: `1px solid ${agent.color}55`,
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 160,
          maxWidth: 220,
          boxShadow: `0 0 20px ${agent.color}22, 0 8px 32px rgba(0,0,0,0.7)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16 }}>{agent.icon}</span>
          <span style={{ color: '#f0f0f0', fontWeight: 600, fontSize: 13 }}>{agent.name}</span>
        </div>
        <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{agent.desc}</p>
        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: agent.color,
          }}
        >
          {agent.cat}
        </div>
      </motion.div>
    </div>
  )
}

// Static star positions — computed once, deterministic (more stars for deeper space feel)
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: ((i * 137.508 + 23) % 100),
  y: ((i * 97.3 + 11) % 100),
  size: 0.8 + (i % 4) * 0.6,
  dur: 2 + (i % 7) * 0.8,
  delay: (i * 0.41) % 6,
}))

// Shooting stars — a few streaks across the background
const SHOOTING_STARS = Array.from({ length: 3 }, (_, i) => ({
  id: i,
  startX: 15 + i * 30,
  startY: 5 + i * 12,
  angle: 25 + i * 10,
  duration: 1.8 + i * 0.4,
  delay: 4 + i * 7,
}))

// Which agent indices get a connection line (7 picks across all 40 agents)
const CONNECTED_INDICES = new Set([2, 6, 11, 17, 24, 28, 35])

function OrbitalDesktop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.2 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = (e.clientX - cx) / rect.width
    const dy = (e.clientY - cy) / rect.height
    setMouseOffset({ x: -dx * 14, y: -dy * 14 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 })
  }, [])

  const innerR = 190
  const midR = 295
  const outerR = 375

  // Precompute connection line endpoints (relative to center, at rest angle)
  // We derive the endpoint once — the SVG sits outside the spinning rings so
  // lines will appear to point toward current node positions; for a static
  // subtle effect this is perfect and avoids JS animation loops.
  const connectionLines = useMemo(() => {
    const lines: { x2: number; y2: number; color: string; delay: number }[] = []
    const addLines = (agents: Agent[], r: number, startGlobalIdx: number) => {
      agents.forEach((agent, i) => {
        const gi = startGlobalIdx + i
        if (CONNECTED_INDICES.has(gi)) {
          const rad = ((i / agents.length) * 360 * Math.PI) / 180
          lines.push({
            x2: Math.cos(rad) * r,
            y2: Math.sin(rad) * r,
            color: agent.color,
            delay: (gi * 0.7) % 3,
          })
        }
      })
    }
    addLines(BUILD_AGENTS, innerR, 0)
    addLines(ANALYZE_OPTIMIZE_AGENTS, midR, BUILD_AGENTS.length)
    addLines(GROWTH_AGENTS, outerR, BUILD_AGENTS.length + ANALYZE_OPTIMIZE_AGENTS.length)
    return lines
  }, [innerR, midR, outerR])

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ height: 860, width: '100%' }}
    >
      {/* Nebula glow — deep space atmosphere */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: [
            'radial-gradient(ellipse 40% 35% at 30% 40%, rgba(99,102,241,0.04) 0%, transparent 70%)',
            'radial-gradient(ellipse 35% 30% at 70% 60%, rgba(168,85,247,0.03) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(212,175,55,0.025) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* Star particles — scattered background dots */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {STARS.map(s => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: s.size > 1.8 ? '#fffbe6' : '#fff',
              opacity: 0.6,
              animation: `starTwinkle ${s.dur}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* Shooting stars */}
        {SHOOTING_STARS.map(ss => (
          <div
            key={`shoot-${ss.id}`}
            style={{
              position: 'absolute',
              left: `${ss.startX}%`,
              top: `${ss.startY}%`,
              width: 60,
              height: 1.5,
              borderRadius: 1,
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 40%, rgba(212,175,55,0.4) 100%)',
              transform: `rotate(${ss.angle}deg)`,
              opacity: 0,
              animation: `shootingStar ${ss.duration}s ease-out infinite`,
              animationDelay: `${ss.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Category labels */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${mouseOffset.x * 0.3}px), calc(-50% + ${mouseOffset.y * 0.3}px))`,
          width: (outerR + 70) * 2,
          height: (outerR + 70) * 2,
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {/* Build label - top left */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            left: '10%',
            color: '#D4AF37',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          Build (24)
        </div>
        {/* Analyze & Optimize label - right */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '2%',
            transform: 'translateY(-50%)',
            color: '#60A5FA',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.85,
            textAlign: 'right',
          }}
        >
          Analyze &<br />Optimize (10)
        </div>
        {/* Growth label - bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            color: '#10B981',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            opacity: 0.85,
          }}
        >
          Growth (6)
        </div>
      </div>

      {/* Parallax wrapper — 3D perspective container */}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px))`,
          transition: 'transform 0.12s ease-out',
          width: 0,
          height: 0,
          perspective: 1200,
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* 3D scene root — preserve-3d so children can tilt in 3D space */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Dashed orbit guide rings (slow independent rotation, tilted) */}
          {([innerR, midR, outerR] as const).map((r, i) => {
            const colors = ['#D4AF3728', '#60A5FA22', '#10B98122']
            const durations = ['180s', '240s', '200s']
            const tilt = 18
            return (
              <div
                key={`guide-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: r * 2,
                  height: r * 2,
                  transform: `translate(-50%, -50%) rotateX(${tilt}deg)`,
                  borderRadius: '50%',
                  border: `1px dashed ${colors[i]}`,
                  animation: `guideSpin${i} ${durations[i]} linear infinite`,
                  pointerEvents: 'none',
                  willChange: 'transform',
                }}
              />
            )
          })}

          {/* SVG connection lines — from center to select agent positions */}
          <svg
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) rotateX(18deg)`,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 8,
            }}
            width={0}
            height={0}
            viewBox="0 0 0 0"
          >
            {connectionLines.map((line, i) => (
              <line
                key={i}
                x1={0}
                y1={0}
                x2={line.x2}
                y2={line.y2}
                stroke={line.color}
                strokeWidth={0.5}
                strokeLinecap="round"
                style={{
                  opacity: 0,
                  animation: `connPulse 3s ease-in-out infinite`,
                  animationDelay: `${line.delay}s`,
                }}
              />
            ))}
          </svg>

          {/* Rotating ring wrappers — tilted with rotateX for 3D orbital look */}
          {/* Inner ring — Build (24) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: innerR * 2,
              height: innerR * 2,
              transform: 'translate(-50%, -50%)',
              animation: 'orbitSpin_flat_inner 180s linear infinite',
              borderRadius: '50%',
              willChange: 'transform',
            }}
          >
            {BUILD_AGENTS.map((agent, i) => {
              const angle = (i / BUILD_AGENTS.length) * 360
              return (
                <RingNode
                  key={agent.name}
                  agent={agent}
                  angle={angle}
                  radius={innerR}
                  ringIndex={0}
                  nodeIndex={i}
                  onHover={setTooltip}
                />
              )
            })}
          </div>

          {/* Middle ring — Analyze + Optimize (10) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: midR * 2,
              height: midR * 2,
              transform: 'translate(-50%, -50%)',
              animation: 'orbitSpin_flat_mid 140s linear infinite reverse',
              borderRadius: '50%',
              willChange: 'transform',
            }}
          >
            {ANALYZE_OPTIMIZE_AGENTS.map((agent, i) => {
              const angle = (i / ANALYZE_OPTIMIZE_AGENTS.length) * 360
              return (
                <RingNode
                  key={agent.name}
                  agent={agent}
                  angle={angle}
                  radius={midR}
                  ringIndex={1}
                  nodeIndex={BUILD_AGENTS.length + i}
                  onHover={setTooltip}
                />
              )
            })}
          </div>

          {/* Outer ring — Growth (6) */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: outerR * 2,
              height: outerR * 2,
              transform: 'translate(-50%, -50%)',
              animation: 'orbitSpin_flat_outer 100s linear infinite',
              borderRadius: '50%',
              willChange: 'transform',
            }}
          >
            {GROWTH_AGENTS.map((agent, i) => {
              const angle = (i / GROWTH_AGENTS.length) * 360
              return (
                <RingNode
                  key={agent.name}
                  agent={agent}
                  angle={angle}
                  radius={outerR}
                  ringIndex={2}
                  nodeIndex={BUILD_AGENTS.length + ANALYZE_OPTIMIZE_AGENTS.length + i}
                  onHover={setTooltip}
                />
              )
            })}
          </div>

          {/* Center orb */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
            }}
          >
            {/* Pulse rings */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 80 + i * 30,
                  height: 80 + i * 30,
                  borderRadius: '50%',
                  border: '1px solid #D4AF3730',
                  animation: `pulseRing ${1.8 + i * 0.6}s ease-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* Ground reflection — blurred squished ellipse below orb */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: '50%',
                top: '100%',
                transform: 'translate(-50%, 6px) scaleY(0.25)',
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse at 50% 50%, #D4AF3755 0%, transparent 70%)',
                filter: 'blur(8px)',
                pointerEvents: 'none',
                opacity: 0.6,
                animation: 'orbPulse 3s ease-in-out infinite',
              }}
            />

            {/* 3D sphere orb — layered radial gradients simulate highlight + depth */}
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: [
                  // Specular highlight top-left
                  'radial-gradient(circle at 32% 28%, #fff8dc55 0%, transparent 40%)',
                  // Main sphere color
                  'radial-gradient(circle at 45% 40%, #E8C84A 0%, #A07818 38%, #4A320A 65%, #050810 100%)',
                ].join(', '),
                border: '1.5px solid #D4AF3788',
                boxShadow: [
                  '0 0 28px #D4AF3755',
                  '0 0 70px #D4AF3728',
                  '0 8px 32px rgba(0,0,0,0.7)',
                  'inset 0 -8px 20px rgba(0,0,0,0.5)',
                  'inset 0 4px 12px #fff8dc18',
                ].join(', '),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'orbPulse 3s ease-in-out infinite',
                willChange: 'box-shadow',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <span
                style={{
                  color: '#FFF8DC',
                  fontWeight: 800,
                  fontSize: 22,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                }}
              >
                40+
              </span>
              <span
                style={{
                  color: '#D4AF37CC',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                Agents
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && <TooltipCard info={tooltip} />}
    </div>
  )
}

function MobileStrip() {
  const [activeCat, setActiveCat] = useState<MobileCat>('build')

  const agentsByCat: Record<MobileCat, Agent[]> = {
    build: BUILD_AGENTS,
    analyze: AGENTS.filter(a => a.cat === 'analyze'),
    optimize: AGENTS.filter(a => a.cat === 'optimize'),
    growth: GROWTH_AGENTS,
  }

  const active = agentsByCat[activeCat]

  return (
    <div className="block md:hidden">
      {/* Sticky category tabs */}
      <div
        className="sticky top-0 z-30 flex gap-2 overflow-x-auto pb-2 pt-1 px-4"
        style={{ background: '#050810', scrollbarWidth: 'none' }}
      >
        {ALL_MOBILE_CATS.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: 20,
              border: `1.5px solid ${activeCat === cat ? CAT_COLORS[cat] : '#1e2640'}`,
              background: activeCat === cat ? `${CAT_COLORS[cat]}18` : 'transparent',
              color: activeCat === cat ? CAT_COLORS[cat] : '#6b7280',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {CAT_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Horizontal scroll cards */}
      <div
        className="flex gap-3 overflow-x-auto px-4 py-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {active.map(agent => (
          <div
            key={agent.name}
            style={{
              flexShrink: 0,
              width: 140,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${agent.color}33`,
              borderRadius: 12,
              padding: '12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 22 }}>{agent.icon}</div>
            <div style={{ color: '#f0f0f0', fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
              {agent.name}
            </div>
            <div style={{ color: '#6b7280', fontSize: 11, lineHeight: 1.4 }}>{agent.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AgentOrbital() {
  return (
    <section
      style={{ background: '#050810', position: 'relative', overflow: 'hidden' }}
      className="py-24"
    >
      {/* CSS keyframes injected via style tag */}
      <style>{`
        /* ── Orbital ring spins (flat — only rotateZ, no tilt on agent rings) ── */
        @keyframes orbitSpin_flat_inner {
          from { transform: translate(-50%, -50%) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateZ(360deg); }
        }
        @keyframes orbitSpin_flat_mid {
          from { transform: translate(-50%, -50%) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateZ(-360deg); }
        }
        @keyframes orbitSpin_flat_outer {
          from { transform: translate(-50%, -50%) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateZ(360deg); }
        }

        /* ── Dashed guide ring slow rotations (per-ring so they're all different) ── */
        @keyframes guideSpin0 {
          from { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(360deg); }
        }
        @keyframes guideSpin1 {
          from { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(-360deg); }
        }
        @keyframes guideSpin2 {
          from { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(0deg); }
          to   { transform: translate(-50%, -50%) rotateX(18deg) rotateZ(360deg); }
        }

        /* ── Center orb pulse (box-shadow) ── */
        @keyframes orbPulse {
          0%, 100% {
            box-shadow:
              0 0 28px #D4AF3755, 0 0 70px #D4AF3728,
              0 8px 32px rgba(0,0,0,0.7),
              inset 0 -8px 20px rgba(0,0,0,0.5),
              inset 0 4px 12px #fff8dc18;
          }
          50% {
            box-shadow:
              0 0 42px #D4AF3777, 0 0 100px #D4AF3744,
              0 8px 32px rgba(0,0,0,0.7),
              inset 0 -8px 20px rgba(0,0,0,0.5),
              inset 0 4px 12px #fff8dc30;
          }
        }

        /* ── Pulse rings emanating from center ── */
        @keyframes pulseRing {
          0%   { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          70%  { opacity: 0;   transform: translate(-50%, -50%) scale(1.4); }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.4); }
        }

        /* ── Space drift — multi-axis floating like zero-G ── */
        @keyframes spaceDrift {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          20%  { transform: translate(var(--drift-x, 4px), calc(var(--drift-y, 3px) * -1)) rotate(calc(var(--drift-rot, 3deg) * 0.6)) scale(var(--drift-scale, 0.98)); }
          45%  { transform: translate(calc(var(--drift-x, 4px) * -0.7), calc(var(--drift-y, 3px) * 0.5)) rotate(calc(var(--drift-rot, 3deg) * -1)) scale(1.01); }
          65%  { transform: translate(calc(var(--drift-x, 4px) * 0.4), var(--drift-y, 3px)) rotate(calc(var(--drift-rot, 3deg) * 0.4)) scale(var(--drift-scale, 0.98)); }
          85%  { transform: translate(calc(var(--drift-x, 4px) * -0.3), calc(var(--drift-y, 3px) * -0.6)) rotate(calc(var(--drift-rot, 3deg) * -0.5)) scale(1); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }

        /* ── Ripple ring expanding outward on hover ── */
        @keyframes nodeRipple {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }

        /* ── SVG connection line pulse ── */
        @keyframes connPulse {
          0%, 100% { opacity: 0;    }
          30%, 70% { opacity: 0.45; }
        }

        /* ── Star twinkle ── */
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.1; }
          50%       { opacity: 0.8; }
        }

        /* ── Shooting star streak ── */
        @keyframes shootingStar {
          0%   { opacity: 0; transform: rotate(var(--angle, 25deg)) translateX(0); }
          5%   { opacity: 0.9; }
          30%  { opacity: 0.6; transform: rotate(var(--angle, 25deg)) translateX(120px); }
          50%  { opacity: 0; transform: rotate(var(--angle, 25deg)) translateX(200px); }
          100% { opacity: 0; }
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Ambient background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <h2
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: '#f0f0f0', lineHeight: 1.15 }}
          >
            The largest AI agent army ever built{' '}
            <span style={{ color: '#D4AF37' }}>for Roblox.</span>
          </h2>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center text-base md:text-lg mb-2"
          style={{ color: '#6b7280', maxWidth: 520, margin: '12px auto 0' }}
        >
          Every agent is a specialist. They chain together to build your entire game.
        </motion.p>

        {/* Desktop orbital */}
        <div className="hidden md:block">
          <OrbitalDesktop />
        </div>

        {/* Mobile strip */}
        <MobileStrip />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex justify-center mt-10"
        >
          <Link
            href="/editor"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 32px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
              color: '#050810',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '0.01em',
              textDecoration: 'none',
              boxShadow: '0 0 24px #D4AF3740',
              transition: 'box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 40px #D4AF3766'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 0 24px #D4AF3740'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
            }}
          >
            Start building with 40+ agents
            <span style={{ fontSize: 17 }}>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

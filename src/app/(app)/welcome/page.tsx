'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

// ─── Confetti ─────────────────────────────────────────────────────────────────

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  vr: number
  opacity: number
  shape: 'rect' | 'circle'
}

const CONFETTI_COLORS = [
  '#FFB81C', '#FFD166', '#F9C74F',
  '#FFFFFF', '#E0E0E0',
  '#4FC3F7', '#81D4FA',
  '#A5D6A7', '#C8E6C9',
]

function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || startedRef.current) return
    startedRef.current = true

    const ctx = canvas.getContext('2d')!
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    // Spawn particles
    const COUNT = 180
    for (let i = 0; i < COUNT; i++) {
      particlesRef.current.push({
        id: i,
        x: Math.random() * width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.2,
        opacity: 1,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      })
    }

    let tick = 0
    const loop = () => {
      ctx.clearRect(0, 0, width, height)
      tick++

      particlesRef.current = particlesRef.current.map((p) => {
        const ny = p.y + p.vy
        const nx = p.x + p.vx
        const nop = ny > height * 0.75 ? Math.max(0, p.opacity - 0.018) : p.opacity
        return { ...p, y: ny, x: nx, rotation: p.rotation + p.vr, opacity: nop }
      }).filter((p) => p.opacity > 0)

      for (const p of particlesRef.current) {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (particlesRef.current.length > 0) {
        frameRef.current = requestAnimationFrame(loop)
      }
    }

    frameRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}

// ─── Quick Start Cards ─────────────────────────────────────────────────────────

interface CardProps {
  icon: string
  title: string
  description: string
  cta: string
  href: string
  accent?: boolean
  external?: boolean
}

function QuickStartCard({ icon, title, description, cta, href, accent, external }: CardProps) {
  const inner = (
    <div
      className={`group relative flex flex-col gap-3 p-5 rounded-2xl border transition-all duration-200 cursor-pointer h-full
        ${accent
          ? 'border-[#FFB81C]/50 bg-[#FFB81C]/8 hover:border-[#FFB81C] hover:bg-[#FFB81C]/12'
          : 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/7'
        }`}
    >
      <div className="text-3xl">{icon}</div>
      <div>
        <p className={`font-semibold text-sm mb-1 ${accent ? 'text-[#FFB81C]' : 'text-white'}`}>{title}</p>
        <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
      </div>
      <div className="mt-auto">
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold transition-colors
            ${accent ? 'text-[#FFB81C] group-hover:text-[#FFD166]' : 'text-gray-300 group-hover:text-white'}`}
        >
          {cta} →
        </span>
      </div>
    </div>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="h-full block">
        {inner}
      </a>
    )
  }

  return <Link href={href} className="h-full block">{inner}</Link>
}

// ─── Checklist ────────────────────────────────────────────────────────────────

interface CheckItem {
  id: string
  label: string
  done: boolean
  href?: string
}

const INITIAL_CHECKLIST: CheckItem[] = [
  { id: 'account', label: 'Create your account', done: true },
  { id: 'tokens', label: 'Claim your 1,000 free tokens', done: true },
  { id: 'editor', label: 'Open the editor and create your first build', done: false, href: '/editor' },
  { id: 'marketplace', label: 'Browse the asset marketplace', done: false, href: '/marketplace' },
  { id: 'invite', label: 'Invite a friend and earn 500 bonus tokens', done: false },
]

function GettingStartedChecklist() {
  const [items, setItems] = useState<CheckItem[]>(INITIAL_CHECKLIST)

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    )
  }

  const doneCount = items.filter((i) => i.done).length
  const pct = Math.round((doneCount / items.length) * 100)

  return (
    <div className="bg-[#141414] border border-white/10 rounded-2xl p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">Getting Started</h2>
        <span className="text-xs text-gray-400">{doneCount}/{items.length} complete</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/10 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <button
              onClick={() => toggle(item.id)}
              className={`w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
                item.done
                  ? 'bg-[#FFB81C] border-[#FFB81C]'
                  : 'border-white/20 bg-transparent hover:border-[#FFB81C]/60'
              }`}
              aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>

            <span className={`text-sm flex-1 ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
              {item.href && !item.done ? (
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Referral Banner ──────────────────────────────────────────────────────────

function ReferralBanner() {
  const [copied, setCopied] = useState(false)
  const { user } = useUser()

  const referralCode = user?.id
    ? `FRJ-${user.id.slice(-6).toUpperCase()}`
    : 'FRJ-XXXXXX'

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://forjegames.com/ref/${referralCode}`).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#1A1400] to-[#0D1520] border border-[#FFB81C]/30 rounded-2xl p-5 sm:p-6">
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-[#FFB81C]/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🎁</span>
            <p className="text-white font-semibold text-sm">Invite friends, earn tokens</p>
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            Share your link. Each friend who signs up gives you both <span className="text-[#FFB81C] font-semibold">500 bonus tokens</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono select-all">
            {referralCode}
          </div>
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-[#FFB81C] text-black hover:bg-[#E6A519]'
            }`}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Token Badge ──────────────────────────────────────────────────────────────

function TokenBadge() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className={`inline-flex items-center gap-2 bg-[#FFB81C]/12 border border-[#FFB81C]/40 rounded-full px-4 py-1.5 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-base">🪙</span>
      <span className="text-[#FFB81C] font-bold text-sm">1,000 free tokens ready</span>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter()
  const { user } = useUser()
  const [showConfetti, setShowConfetti] = useState(false)

  const firstName =
    user?.firstName ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    ''

  useEffect(() => {
    // Small delay so the page paints before confetti fires
    const t = setTimeout(() => setShowConfetti(true), 150)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-[#080B1A] text-white">
      {showConfetti && <Confetti />}

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-5 select-none">🎉</div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
            Welcome to ForjeGames
            {firstName ? (
              <span className="text-[#FFB81C]">, {firstName}</span>
            ) : null}
            !
          </h1>

          <p className="text-gray-400 text-base mb-5">
            Your account is live. Start building in seconds.
          </p>

          <TokenBadge />
        </div>

        {/* Quick start cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <QuickStartCard
            icon="⚒️"
            title="Start Building"
            description="Open the AI editor and generate your first Roblox map with a single prompt."
            cta="Open Editor"
            href="/editor"
            accent
          />
          <QuickStartCard
            icon="🛒"
            title="Browse Marketplace"
            description="Thousands of ready-made assets. Drop them straight into your project."
            cta="Explore"
            href="/marketplace"
          />
          <QuickStartCard
            icon="▶️"
            title="Watch Tutorial"
            description="5-minute walkthrough — terrain, scripting, and export covered."
            cta="Watch Now"
            href="https://docs.forjegames.com/tutorial"
            external
          />
        </div>

        {/* Getting started checklist */}
        <div className="mb-6">
          <GettingStartedChecklist />
        </div>

        {/* Referral */}
        <div className="mb-10">
          <ReferralBanner />
        </div>

        {/* Go to editor CTA */}
        <div className="text-center">
          <button
            onClick={() => router.push('/editor')}
            className="px-8 py-3 bg-[#FFB81C] text-black text-sm font-bold rounded-xl hover:bg-[#E6A519] transition-all active:scale-95"
          >
            Go to Editor →
          </button>
          <p className="text-gray-600 text-xs mt-3">No credit card required. Tokens never expire.</p>
        </div>

      </div>
    </div>
  )
}

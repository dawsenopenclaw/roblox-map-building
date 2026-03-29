'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlowCard } from '@/components/ui/glow-card'
import { AnimatedCard } from '@/components/ui/animated-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeneCard {
  id: string
  label: string
  value: number
  description: string
  color: string
  icon: string
}

interface Recommendation {
  id: string
  type: 'opportunity' | 'warning' | 'insight'
  title: string
  body: string
}

interface AnalysisResult {
  gameName: string
  gameGenre: string
  playerCount: string
  rating: string
  genes: GeneCard[]
  recommendations: Recommendation[]
  radarValues: { axis: string; score: number }[]
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ANALYSIS: AnalysisResult = {
  gameName: 'Blox Fruits',
  gameGenre: 'Adventure RPG',
  playerCount: '142,847',
  rating: '92%',
  genes: [
    { id: 'progression', label: 'Progression Loop', value: 96, description: 'Extremely strong level-up and unlock system. Players stay for hours chasing the next milestone.', color: '#FFB81C', icon: '🎯' },
    { id: 'social', label: 'Social Hooks', value: 78, description: 'Guild mechanics and PvP arenas drive player interaction. Trading system adds economy depth.', color: '#10B981', icon: '👥' },
    { id: 'monetization', label: 'Monetization DNA', value: 89, description: 'Gamepass gating on premium fruits and fast-travel is aggressive but effective.', color: '#3B82F6', icon: '💎' },
    { id: 'retention', label: 'Retention Signals', value: 83, description: 'Daily login bonuses and limited-time events create strong return loops.', color: '#8B5CF6', icon: '🔄' },
    { id: 'discovery', label: 'Discovery Hooks', value: 71, description: 'Strong thumbnail CTR. Title keyword optimized for RPG and anime searches.', color: '#EF4444', icon: '🔍' },
    { id: 'content', label: 'Content Depth', value: 91, description: '22 sea areas, 87 unique fruits, seasonal updates. Players rarely run out of content.', color: '#F59E0B', icon: '📦' },
  ],
  recommendations: [
    { id: 'r1', type: 'opportunity', title: 'Add Guild Wars Event', body: 'Competitor analysis shows guild-vs-guild events spike concurrent players by 34%. Blox Fruits has the guild infra but no scheduled war mechanic.' },
    { id: 'r2', type: 'insight', title: 'Thumbnail A/B Test', body: 'Top 3 competing games use character action poses. Current static logo thumbnail loses CTR. A/B test an action shot to capture 15–20% more clicks.' },
    { id: 'r3', type: 'warning', title: 'Monetization Friction', body: 'Fruit awakening is gated behind R$1200+ in passes. Player reviews cite this as the #1 churn reason after level 1000.' },
    { id: 'r4', type: 'opportunity', title: 'Seasonal Content Gap', body: 'No summer/winter seasonal update detected in 8 months. Seasonal events average +22% DAU for top-50 games in this genre.' },
  ],
  radarValues: [
    { axis: 'Progression', score: 96 },
    { axis: 'Social', score: 78 },
    { axis: 'Monetization', score: 89 },
    { axis: 'Retention', score: 83 },
    { axis: 'Discovery', score: 71 },
    { axis: 'Content', score: 91 },
  ],
}

const EXAMPLE_URLS = [
  'https://www.roblox.com/games/2753915549/Blox-Fruits',
  'https://www.roblox.com/games/142823291/Adopt-Me',
  'https://www.roblox.com/games/6284583030/Pet-Simulator-X',
]

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({ values }: { values: { axis: string; score: number }[] }) {
  const cx = 120
  const cy = 120
  const r = 90
  const n = values.length
  const levels = [20, 40, 60, 80, 100]

  const angleForIndex = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

  const pointOnCircle = (score: number, index: number) => {
    const angle = angleForIndex(index)
    const dist = (score / 100) * r
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    }
  }

  const levelPoints = (pct: number) =>
    values
      .map((_, i) => {
        const angle = angleForIndex(i)
        const dist = (pct / 100) * r
        return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`
      })
      .join(' ')

  const dataPolygon = values
    .map((v, i) => {
      const pt = pointOnCircle(v.score, i)
      return `${pt.x},${pt.y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-[240px] mx-auto" aria-label="Game DNA radar chart">
      {/* Grid levels */}
      {levels.map((lvl) => (
        <polygon
          key={lvl}
          points={levelPoints(lvl)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {values.map((_, i) => {
        const angle = angleForIndex(i)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        )
      })}

      {/* Gold glow fill */}
      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB81C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <polygon
        points={dataPolygon}
        fill="url(#radarGrad)"
        stroke="#FFB81C"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data dots */}
      {values.map((v, i) => {
        const pt = pointOnCircle(v.score, i)
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="4"
            fill="#FFB81C"
            stroke="#0a0a0a"
            strokeWidth="2"
          />
        )
      })}

      {/* Axis labels */}
      {values.map((v, i) => {
        const angle = angleForIndex(i)
        const labelR = r + 18
        const x = cx + labelR * Math.cos(angle)
        const y = cy + labelR * Math.sin(angle)
        const anchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle'
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="9"
            fill="rgba(255,255,255,0.55)"
            fontFamily="Inter, sans-serif"
          >
            {v.axis}
          </text>
        )
      })}
    </svg>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

// ─── Recommendation Badge ─────────────────────────────────────────────────────

const REC_STYLE = {
  opportunity: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', label: 'OPPORTUNITY', dot: 'bg-emerald-400' },
  warning:     { bg: 'bg-red-500/10',     border: 'border-red-500/25',     text: 'text-red-400',     label: 'WARNING',     dot: 'bg-red-400' },
  insight:     { bg: 'bg-blue-500/10',    border: 'border-blue-500/25',    text: 'text-blue-400',    label: 'INSIGHT',     dot: 'bg-blue-400' },
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AnalysisSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Analyzing game...">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#FFB81C]/8 border border-[#FFB81C]/20 rounded-xl">
        <span className="w-3 h-3 rounded-full bg-[#FFB81C] animate-pulse flex-shrink-0" />
        <span className="text-sm text-[#FFB81C] font-medium">Sequencing game DNA...</span>
        <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden ml-auto max-w-[160px]">
          <motion.div
            className="h-full bg-[#FFB81C] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 2.4, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Steps */}
      {['Fetching game metadata', 'Parsing player telemetry', 'Running gene classifier', 'Generating recommendations'].map((step, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.5, duration: 0.3 }}
          className="flex items-center gap-3 text-sm"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.5 + 0.1 }}
            className="w-5 h-5 rounded-full border border-[#FFB81C]/30 flex items-center justify-center flex-shrink-0"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-[#FFB81C]"
            />
          </motion.span>
          <span className="text-gray-300">{step}</span>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function GameDnaPage() {
  const [url, setUrl] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'result'>('idle')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [activeGene, setActiveGene] = useState<string | null>(null)

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return
    setPhase('loading')
    setResult(null)
    // Simulate API latency — swap for real fetch('/api/game-dna/analyze', ...) call
    await new Promise((res) => setTimeout(res, 2600))
    setResult(DEMO_ANALYSIS)
    setPhase('result')
    setActiveGene(null)
  }, [url])

  const handleExample = (exUrl: string) => {
    setUrl(exUrl)
    setPhase('idle')
    setResult(null)
  }

  const reset = () => {
    setUrl('')
    setPhase('idle')
    setResult(null)
    setActiveGene(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#FFB81C]/70 uppercase tracking-widest">AI Feature</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-xs text-gray-400">Game Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
          Analyze Any{' '}
          <span className="text-[#FFB81C] drop-shadow-[0_0_20px_rgba(255,184,28,0.4)]">
            Roblox Game
          </span>
        </h1>
        <p className="text-gray-300 text-base max-w-xl leading-relaxed">
          Paste any Roblox game URL and our AI sequences its DNA — progression loops,
          monetization patterns, retention hooks, and growth opportunities.
        </p>
      </div>

      {/* ── URL Input Card ── */}
      <GlowCard className="bg-[#141414] border border-white/8 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            {/* Subtle icon */}
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze() }}
              placeholder="Paste any Roblox game URL..."
              disabled={phase === 'loading'}
              className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-400/50 focus:bg-[#1c1c1c] transition-colors disabled:opacity-50"
            />
          </div>
          <button
            onClick={phase === 'result' ? reset : handleAnalyze}
            disabled={phase === 'loading' || (!url.trim() && phase !== 'result')}
            className="flex-shrink-0 h-11 px-6 rounded-xl bg-[#FFB81C] hover:bg-[#D4AF37] disabled:opacity-30 disabled:cursor-not-allowed text-[#0a0a0a] text-sm font-bold transition-all duration-150 flex items-center gap-2 shadow-[0_0_20px_rgba(255,184,28,0.25)]"
          >
            {phase === 'loading' ? (
              <>
                <span className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                Analyzing
              </>
            ) : phase === 'result' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Analysis
              </>
            ) : (
              <>
                Analyze Game
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Example URLs */}
        {phase === 'idle' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Try:</span>
            {EXAMPLE_URLS.map((u) => {
              const name = decodeURIComponent(u.split('/').at(-1) ?? u).replace(/-/g, ' ')
              return (
                <button
                  key={u}
                  onClick={() => handleExample(u)}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-[#FFB81C] hover:border-[#FFB81C]/30 transition-colors"
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}
      </GlowCard>

      {/* ── Loading ── */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-[#141414] border border-white/8 rounded-2xl p-6"
          >
            <AnalysisSkeleton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results ── */}
      <AnimatePresence>
        {phase === 'result' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Game header strip */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-4 bg-[#141414] border border-[#FFB81C]/15 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/15 border border-[#FFB81C]/25 flex items-center justify-center text-xl flex-shrink-0">
                🎮
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg leading-tight">{result.gameName}</h2>
                <p className="text-gray-400 text-sm">{result.gameGenre}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-[#FFB81C] font-bold text-lg">{result.playerCount}</p>
                  <p className="text-gray-400 text-xs">concurrent</p>
                </div>
                <div className="w-px bg-white/8 self-stretch" />
                <div className="text-center">
                  <p className="text-emerald-400 font-bold text-lg">{result.rating}</p>
                  <p className="text-gray-400 text-xs">rating</p>
                </div>
              </div>
            </div>

            {/* Radar + Genes grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* Radar chart */}
              <AnimatedCard className="lg:col-span-2 bg-[#141414] border border-white/8 rounded-2xl p-5 flex flex-col items-center gap-4">
                <div className="w-full flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">DNA Radar</span>
                  <span className="text-xs text-gray-500">6 axes</span>
                </div>
                <RadarChart values={result.radarValues} />
                <p className="text-xs text-gray-500 text-center">Hover a gene card for axis highlight</p>
              </AnimatedCard>

              {/* Gene cards */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.genes.map((gene, i) => (
                  <AnimatedCard
                    key={gene.id}
                    index={i}
                    onClick={() => setActiveGene(activeGene === gene.id ? null : gene.id)}
                    className={`bg-[#141414] border rounded-xl p-4 cursor-pointer transition-colors ${
                      activeGene === gene.id
                        ? 'border-[#FFB81C]/40 bg-[#FFB81C]/5'
                        : 'border-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{gene.icon}</span>
                        <span className="text-sm font-semibold text-white">{gene.label}</span>
                      </div>
                      <span className="text-lg font-bold flex-shrink-0" style={{ color: gene.color }}>
                        {gene.value}
                      </span>
                    </div>
                    <ScoreBar value={gene.value} color={gene.color} />

                    <AnimatePresence>
                      {activeGene === gene.id && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                          className="text-xs text-gray-300 leading-relaxed mt-3 overflow-hidden"
                        >
                          {gene.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </AnimatedCard>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest px-1">
                AI Recommendations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.recommendations.map((rec, i) => {
                  const style = REC_STYLE[rec.type]
                  return (
                    <AnimatedCard
                      key={rec.id}
                      index={i}
                      className={`${style.bg} border ${style.border} rounded-xl p-4 space-y-2`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                        <span className={`text-xs font-bold tracking-widest ${style.text}`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{rec.body}</p>
                    </AnimatedCard>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 px-5 py-4 bg-[#FFB81C]/5 border border-[#FFB81C]/15 rounded-2xl">
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Clone this game&apos;s DNA into your project</p>
                <p className="text-gray-300 text-xs mt-0.5">Inject winning progression loops directly into the editor with one click.</p>
              </div>
              <a
                href="/editor"
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[#FFB81C] hover:bg-[#D4AF37] text-[#0a0a0a] text-sm font-bold transition-colors shadow-[0_0_16px_rgba(255,184,28,0.2)]"
              >
                Open in Editor
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Idle state feature preview ── */}
      {phase === 'idle' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { icon: '🧬', title: 'Gene Sequencing', desc: '12 behavioral genes extracted from any public Roblox game in under 3 seconds.' },
            { icon: '📡', title: 'Live Player Data', desc: 'Real-time concurrent player count, engagement rate, and retention curve analysis.' },
            { icon: '🏆', title: 'Competitor Gaps', desc: 'Automatically surface what top games are doing that yours isn\'t — ranked by impact.' },
          ].map((feat, i) => (
            <AnimatedCard
              key={feat.title}
              index={i}
              className="bg-[#141414] border border-white/8 rounded-xl p-5 space-y-3"
            >
              <span className="text-2xl">{feat.icon}</span>
              <div>
                <p className="text-white font-semibold text-sm">{feat.title}</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">{feat.desc}</p>
              </div>
            </AnimatedCard>
          ))}
        </motion.div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShareButtons } from '@/components/ShareButtons'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GameGenome {
  id: string
  gameType: string
  targetAge: string
  sessionLength: string
  monetizationModel: string
  progressionPace: string
  zoneDensity: string
  artStyle: string
  retentionDriver: string
  estimatedDau: string
  engagementLoop: string
  updateCadence: string
  communitySize: string
  scores: Record<string, number>
  genreAverages: Record<string, number>
  recommendations: string[]
}

interface GameScan {
  id: string
  gameName: string | null
  robloxUrl: string
  status: string
  createdAt: string
  genome: GameGenome | null
}

// ─── Demo scans ───────────────────────────────────────────────────────────────

const DEMO_SCANS: Record<string, GameScan> = {
  'demo-pet-sim': {
    id: 'demo-pet-sim',
    gameName: 'Pet Simulator X',
    robloxUrl: 'https://www.roblox.com/games/6284583030/Pet-Simulator-X',
    status: 'COMPLETE',
    createdAt: new Date().toISOString(),
    genome: {
      id: 'demo-pet-sim-genome',
      gameType: 'Idle Collector',
      targetAge: '9–14',
      sessionLength: '20–40 min',
      monetizationModel: 'Gamepasses + Pets',
      progressionPace: 'Fast Grind',
      zoneDensity: 'Medium',
      artStyle: 'Bright Cartoon',
      retentionDriver: 'Pet Rarity System',
      estimatedDau: '300k–600k',
      engagementLoop: 'Hatch → Rank → Flex',
      updateCadence: 'Weekly',
      communitySize: 'Mega (40M+ visits)',
      scores: {
        game_type: 90,
        target_age: 88,
        session_length: 82,
        monetization_model: 85,
        progression_pace: 91,
        zone_density: 78,
        art_style: 87,
        retention_driver: 94,
        estimated_dau: 89,
        engagement_loop: 95,
        update_cadence: 92,
        community_size: 96,
      },
      genreAverages: {
        game_type: 60, target_age: 65, session_length: 55, monetization_model: 58,
        progression_pace: 50, zone_density: 52, art_style: 60, retention_driver: 55,
        estimated_dau: 50, engagement_loop: 58, update_cadence: 50, community_size: 55,
      },
      recommendations: [
        'Your engagement loop (95) is top-tier. Consider adding a "prestige" reset mechanic to extend long-term retention past the 3-month cliff.',
        'Weekly updates (92) are a key differentiator. Maintain this cadence with a public roadmap to build anticipation and reduce churn.',
        'Monetization (85) leans heavily on gamepasses. Introduce limited-time cosmetic bundles at R$199–299 to capture impulse spend.',
        'Zone density is moderate (78) — adding 1–2 new biomes per major update will keep explorers engaged alongside collectors.',
      ],
    },
  },
  'demo-adopt-me': {
    id: 'demo-adopt-me',
    gameName: 'Adopt Me',
    robloxUrl: 'https://www.roblox.com/games/920587237/Adopt-Me',
    status: 'COMPLETE',
    createdAt: new Date().toISOString(),
    genome: {
      id: 'demo-adopt-me-genome',
      gameType: 'Social Roleplay',
      targetAge: '8–12',
      sessionLength: '45–90 min',
      monetizationModel: 'Cosmetics + Gamepasses',
      progressionPace: 'Slow Grind',
      zoneDensity: 'High',
      artStyle: 'Pastel Cartoon',
      retentionDriver: 'Pet Collection',
      estimatedDau: '500k–1M',
      engagementLoop: 'Collect → Trade → Flex',
      updateCadence: 'Bi-weekly',
      communitySize: 'Mega (50M+ visits)',
      scores: {
        game_type: 82,
        target_age: 90,
        session_length: 78,
        monetization_model: 75,
        progression_pace: 65,
        zone_density: 72,
        art_style: 85,
        retention_driver: 92,
        estimated_dau: 95,
        engagement_loop: 87,
        update_cadence: 76,
        community_size: 98,
      },
      genreAverages: {
        game_type: 60, target_age: 65, session_length: 55, monetization_model: 58,
        progression_pace: 50, zone_density: 52, art_style: 60, retention_driver: 55,
        estimated_dau: 50, engagement_loop: 58, update_cadence: 50, community_size: 55,
      },
      recommendations: [
        'Add a daily login streak reward system — your retention driver score (92) is strong but can be reinforced with explicit habit loops.',
        'Introduce a limited-time trading event every 2 weeks to spike engagement, capitalising on the massive community size (98).',
        'Consider adding a "starter gamepass" at R$99–149 to improve early monetisation conversion from the large free player base.',
        'Zone density is above average (72) — ensure mobile performance is tested; consider a "lite graphics" toggle.',
      ],
    },
  },
  'demo-bee-swarm': {
    id: 'demo-bee-swarm',
    gameName: 'Bee Swarm Simulator',
    robloxUrl: 'https://www.roblox.com/games/1537690962/Bee-Swarm-Simulator',
    status: 'COMPLETE',
    createdAt: new Date().toISOString(),
    genome: {
      id: 'demo-bee-swarm-genome',
      gameType: 'Idle Simulator',
      targetAge: '10–16',
      sessionLength: '30–60 min',
      monetizationModel: 'Gamepasses',
      progressionPace: 'Medium Grind',
      zoneDensity: 'Medium',
      artStyle: 'Stylized Cartoon',
      retentionDriver: 'Quest System',
      estimatedDau: '100k–250k',
      engagementLoop: 'Collect → Upgrade → Quest',
      updateCadence: 'Monthly',
      communitySize: 'Large (10M+ visits)',
      scores: {
        game_type: 80,
        target_age: 82,
        session_length: 78,
        monetization_model: 65,
        progression_pace: 75,
        zone_density: 70,
        art_style: 83,
        retention_driver: 86,
        estimated_dau: 78,
        engagement_loop: 84,
        update_cadence: 62,
        community_size: 80,
      },
      genreAverages: {
        game_type: 60, target_age: 65, session_length: 55, monetization_model: 58,
        progression_pace: 50, zone_density: 52, art_style: 60, retention_driver: 55,
        estimated_dau: 50, engagement_loop: 58, update_cadence: 50, community_size: 55,
      },
      recommendations: [
        'Monetization (65) is the primary weak spot — introduce cosmetic bee skins or hive decorations as non-pay-to-win purchases.',
        'Update cadence (62) lags behind competitors. A "micro-update" strategy with small weekly drops between major patches can sustain excitement.',
        'Quest system retention (86) is strong — expand into a seasonal quest chain to drive monthly return visits.',
        'The medium zone density (70) leaves room to add 1–2 new field types per update to reward long-term players with new content.',
      ],
    },
  },
}

// ─── Genome display labels ────────────────────────────────────────────────────

const GENOME_LABELS: Record<string, string> = {
  game_type: 'Game Type',
  target_age: 'Age Range',
  session_length: 'Session Length',
  monetization_model: 'Monetization',
  progression_pace: 'Progression',
  zone_density: 'Zone Density',
  art_style: 'Art Style',
  retention_driver: 'Retention',
  estimated_dau: 'Est. DAU',
  engagement_loop: 'Eng. Loop',
  update_cadence: 'Update Rate',
  community_size: 'Community',
}

// Ordered keys for consistent display
const GENOME_KEYS = Object.keys(GENOME_LABELS)

// ─── CSS Radar Chart ──────────────────────────────────────────────────────────

interface RadarPoint {
  label: string
  score: number
  average: number
}

function CssRadarChart({ data, gameName }: { data: RadarPoint[]; gameName: string }) {
  const size = 280
  const center = size / 2
  const radius = 110
  const n = data.length

  function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return {
      x: center + r * Math.cos(rad),
      y: center + r * Math.sin(rad),
    }
  }

  function buildPolygon(values: number[], maxR: number) {
    return values
      .map((v, i) => {
        const angle = (360 / n) * i
        const r = (v / 100) * maxR
        const { x, y } = polarToXY(angle, r)
        return `${x},${y}`
      })
      .join(' ')
  }

  const gridLevels = [20, 40, 60, 80, 100]
  const scorePoints = data.map((d) => d.score)
  const avgPoints = data.map((d) => d.average)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridLevels.map((level) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const { x, y } = polarToXY((360 / n) * i, (level / 100) * radius)
            return `${x},${y}`
          }).join(' ')
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          )
        })}

        {/* Spokes */}
        {data.map((_, i) => {
          const { x, y } = polarToXY((360 / n) * i, radius)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1"
            />
          )
        })}

        {/* Genre average polygon */}
        <polygon
          points={buildPolygon(avgPoints, radius)}
          fill="rgba(96,165,250,0.08)"
          stroke="#60A5FA"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Score polygon */}
        <polygon
          points={buildPolygon(scorePoints, radius)}
          fill="rgba(255,184,28,0.15)"
          stroke="#FFB81C"
          strokeWidth="2"
        />

        {/* Axis labels */}
        {data.map((d, i) => {
          const angle = (360 / n) * i
          const { x, y } = polarToXY(angle, radius + 22)
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#9CA3AF"
              fontSize="9"
            >
              {d.label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#FFB81C]" />
          <span className="text-xs text-gray-400">{gameName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-400" style={{ borderTop: '1px dashed #60A5FA' }} />
          <span className="text-xs text-gray-400">Genre Avg</span>
        </div>
      </div>
    </div>
  )
}

// ─── CSS Progression Timeline ─────────────────────────────────────────────────

function CssProgressionChart({ pace }: { pace: number }) {
  const weeks = [
    { label: 'W1',  newPlayer: 0,                       engaged: 0 },
    { label: 'W2',  newPlayer: Math.round(pace * 0.3),  engaged: Math.round(pace * 0.2) },
    { label: 'W4',  newPlayer: Math.round(pace * 0.6),  engaged: Math.round(pace * 0.5) },
    { label: 'W8',  newPlayer: Math.round(pace * 0.85), engaged: Math.round(pace * 0.75) },
    { label: 'W12', newPlayer: Math.round(pace * 0.95), engaged: Math.round(pace * 0.9) },
    { label: 'W20', newPlayer: 100,                      engaged: Math.round(pace) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#FFB81C]" />
          <span className="text-xs text-gray-400">New Player Progress %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-blue-400" />
          <span className="text-xs text-gray-400">Engaged Player %</span>
        </div>
      </div>
      <div className="space-y-3">
        {weeks.map((w) => (
          <div key={w.label} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-7 flex-shrink-0">{w.label}</span>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${w.newPlayer}%`, backgroundColor: '#FFB81C' }}
                />
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${w.engaged}%`, backgroundColor: '#60A5FA' }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-600 w-10 text-right flex-shrink-0">{w.newPlayer}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

// ─── Monetization items ───────────────────────────────────────────────────────

const MONETIZATION_ITEMS = [
  { label: 'Cosmetics',     key: 'monetization_model', weight: 0.4, color: '#FFB81C' },
  { label: 'Gamepasses',   key: 'progression_pace',   weight: 0.3, color: '#60A5FA' },
  { label: 'Premium',      key: 'retention_driver',   weight: 0.2, color: '#A78BFA' },
  { label: 'Dev Products', key: 'engagement_loop',    weight: 0.1, color: '#34D399' },
]

// ─── Main report client ───────────────────────────────────────────────────────

export default function GameDnaReportClient() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const [scan, setScan] = useState<GameScan | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    async function load() {
      // Check if this is a known demo ID first
      if (id && DEMO_SCANS[id]) {
        setScan(DEMO_SCANS[id])
        setIsDemo(true)
        setLoading(false)
        return
      }

      try {
        const token = await getToken()
        const res = await fetch(`${apiUrl}/api/dna/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          // Fall back to Adopt Me demo if API down
          setIsDemo(true)
          setScan(DEMO_SCANS['demo-adopt-me'])
          return
        }
        const data = await res.json() as { scan: GameScan }
        setScan(data.scan)
      } catch {
        setIsDemo(true)
        setScan(DEMO_SCANS['demo-adopt-me'])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, apiUrl, getToken])

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-12 w-64 bg-[#242424] rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[#242424] rounded-2xl animate-pulse" />
          <div className="h-80 bg-[#242424] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-red-400 text-sm mb-4">Scan not found</p>
        <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm">
          Back to scanner
        </Link>
      </div>
    )
  }

  if (!scan.genome) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-4xl mb-4">🧬</div>
        <p className="text-gray-400 text-sm mb-4">
          {scan.status === 'PROCESSING' ? 'Scan still in progress…' : 'No genome data available'}
        </p>
        {scan.status === 'PROCESSING' && (
          <p className="text-gray-600 text-xs">Refresh in 30 seconds.</p>
        )}
        <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm mt-4 inline-block">
          Back to scanner
        </Link>
      </div>
    )
  }

  const { genome } = scan
  const clamp = (v: number) => Math.min(100, Math.max(0, v))

  const radarData: { label: string; score: number; average: number }[] = GENOME_KEYS.map((key) => ({
    label: GENOME_LABELS[key],
    score: clamp(genome.scores[key] ?? 0),
    average: clamp(genome.genreAverages?.[key] ?? 50),
  }))

  const scoreValues = Object.values(genome.scores)
  const totalScore = scoreValues.length > 0
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : 0
  const monetizationScore = genome.scores.monetization_model ?? 50
  const progressionPace = genome.scores.progression_pace ?? 50

  const scoreColor = totalScore >= 90 ? '#34D399' : totalScore >= 80 ? '#FFB81C' : '#60A5FA'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <span className="text-yellow-400 text-xs font-semibold uppercase tracking-wide">Demo</span>
          <p className="text-yellow-400/80 text-sm">
            Sample report — connect your backend to scan real games.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
            All scans
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {scan.gameName || 'Game Analysis'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-2xl font-bold"
              style={{ color: scoreColor }}
            >
              {totalScore}/100
            </span>
            <span className="text-gray-600 text-sm">DNA Score</span>
            <span className="text-gray-700">·</span>
            <a
              href={scan.robloxUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#FFB81C] hover:underline text-sm"
            >
              View on Roblox
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ShareButtons
            url={`${APP_URL}/game-dna/${scan.id}`}
            text={`Check out the Game DNA analysis for "${scan.gameName || 'this game'}" — DNA Score: ${totalScore}/100 on ForjeGames`}
            compact
          />
          <Link
            href={`/game-dna/compare?a=${scan.id}`}
            className="px-4 py-2 text-sm bg-[#242424] border border-white/10 text-white rounded-xl hover:border-white/20 transition-colors"
          >
            Compare
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm bg-[#FFB81C] text-black font-semibold rounded-xl hover:bg-[#E5A619] transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Score summary bar */}
      <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Overall Score',   value: totalScore,                               color: scoreColor },
            { label: 'Monetization',    value: monetizationScore,                        color: '#FFB81C' },
            { label: 'Retention',       value: genome.scores.retention_driver ?? 0,      color: '#60A5FA' },
            { label: 'Engagement Loop', value: genome.scores.engagement_loop ?? 0,       color: '#A78BFA' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}</span>
                <span className="text-xs text-gray-600">/100</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.value}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12-variable genome tags */}
      <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Genome Profile</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Game Type',    value: genome.gameType },
            { label: 'Target Age',   value: genome.targetAge },
            { label: 'Session',      value: genome.sessionLength },
            { label: 'Monetization', value: genome.monetizationModel },
            { label: 'Progression',  value: genome.progressionPace },
            { label: 'Zone Density', value: genome.zoneDensity },
            { label: 'Art Style',    value: genome.artStyle },
            { label: 'Retention',    value: genome.retentionDriver },
            { label: 'Est. DAU',     value: genome.estimatedDau },
            { label: 'Eng. Loop',    value: genome.engagementLoop },
            { label: 'Update Rate',  value: genome.updateCadence },
            { label: 'Community',    value: genome.communitySize },
          ].map((item) => (
            <div key={item.label} className="bg-[#2e2e2e] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm text-white font-medium truncate" title={item.value}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSS Radar chart */}
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Genome Radar vs Genre Average
          </h2>
          <CssRadarChart data={radarData} gameName={scan.gameName || 'This Game'} />
        </div>

        {/* Monetization breakdown */}
        <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Monetization Breakdown
          </h2>
          <div className="space-y-4">
            {MONETIZATION_ITEMS.map((item) => {
              const rawScore = genome.scores[item.key] ?? 50
              const pct = Math.min(Math.round(rawScore * item.weight * 2), 100)
              return (
                <ScoreBar
                  key={item.key}
                  label={item.label}
                  value={pct}
                  color={item.color}
                />
              )
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Monetization Score</span>
              <span className="text-white font-semibold">{monetizationScore}/100</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{genome.monetizationModel}</p>
          </div>
        </div>
      </div>

      {/* Progression timeline */}
      <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
          Progression Timeline
        </h2>
        <p className="text-xs text-gray-600 mb-5">
          Estimated player milestones over 20 weeks — {genome.progressionPace} pace
        </p>
        <CssProgressionChart pace={progressionPace} />
      </div>

      {/* Recommendations */}
      <div className="bg-[#242424] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Strategic Recommendations
        </h2>
        <div className="space-y-3">
          {(Array.isArray(genome.recommendations) ? genome.recommendations : []).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#2e2e2e] rounded-xl px-4 py-3">
              <span className="text-[#FFB81C] text-sm font-bold flex-shrink-0 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
            </div>
          ))}
          {(genome.recommendations?.length ?? 0) === 0 && (
            <p className="text-gray-500 text-sm">No recommendations available.</p>
          )}
        </div>
      </div>
    </div>
  )
}

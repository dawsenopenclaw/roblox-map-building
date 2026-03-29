'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShareButtons } from '@/components/ShareButtons'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://robloxforge.gg'

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

// Progression timeline mock data based on genome values
function buildProgressionData(genome: GameGenome) {
  const pace = genome.scores.progression_pace ?? 50
  return [
    { week: 'W1', newPlayer: 0, engaged: 0 },
    { week: 'W2', newPlayer: Math.round(pace * 0.3), engaged: Math.round(pace * 0.2) },
    { week: 'W4', newPlayer: Math.round(pace * 0.6), engaged: Math.round(pace * 0.5) },
    { week: 'W8', newPlayer: Math.round(pace * 0.85), engaged: Math.round(pace * 0.75) },
    { week: 'W12', newPlayer: Math.round(pace * 0.95), engaged: Math.round(pace * 0.9) },
    { week: 'W20', newPlayer: 100, engaged: Math.round(pace) },
  ]
}

// Monetization breakdown labels
const MONETIZATION_ITEMS = [
  { label: 'Cosmetics', key: 'monetization_model', weight: 0.4, color: '#FFB81C' },
  { label: 'Gamepasses', key: 'progression_pace',  weight: 0.3, color: '#60A5FA' },
  { label: 'Premium',   key: 'retention_driver',   weight: 0.2, color: '#A78BFA' },
  { label: 'Dev Products', key: 'engagement_loop', weight: 0.1, color: '#34D399' },
]

function MonetizationBar({ label, value, color }: { label: string; value: number; color: string }) {
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

export default function GameDnaReportClient() {
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()
  const [scan, setScan] = useState<GameScan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken()
        const res = await fetch(`${apiUrl}/api/dna/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setError('Scan not found or access denied')
          return
        }
        const data = await res.json() as { scan: GameScan }
        setScan(data.scan)
      } catch {
        setError('Failed to load scan report')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, apiUrl, getToken])

  async function handleExportPdf() {
    // Basic print-to-PDF fallback
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-12 w-64 bg-[#0D1231] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-[#0D1231] rounded-2xl animate-pulse" />
          <div className="h-80 bg-[#0D1231] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-red-400 text-sm mb-4">{error || 'Scan not found'}</p>
        <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm">
          ← Back to scanner
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
          <p className="text-gray-600 text-xs">This page will auto-update when complete. Refresh in 30s.</p>
        )}
        <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm mt-4 inline-block">
          ← Back to scanner
        </Link>
      </div>
    )
  }

  const { genome } = scan
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  const radarData = Object.entries(GENOME_LABELS).map(([key, name]) => ({
    subject: name,
    score: clamp(genome.scores[key] ?? 0),
    average: clamp(genome.genreAverages?.[key] ?? 50),
    fullMark: 100,
  }))

  const progressionData = buildProgressionData(genome)
  const totalScore = Math.round(Object.values(genome.scores).reduce((a, b) => a + b, 0) / Object.keys(genome.scores).length)
  const monetizationScore = genome.scores.monetization_model ?? 50

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
            ← All scans
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {scan.gameName || 'Game Analysis'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            DNA Score: <span className="text-white font-semibold">{totalScore}/100</span>
            <span className="mx-2 text-gray-600">·</span>
            <a href={scan.robloxUrl} target="_blank" rel="noreferrer" className="text-[#FFB81C] hover:underline">
              View on Roblox ↗
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <ShareButtons
            url={`${APP_URL}/game-dna/${scan.id}`}
            text={`Check out the Game DNA analysis for "${scan.gameName || 'this game'}" — DNA Score: ${totalScore}/100 on RobloxForge`}
            compact
          />
          <Link
            href={`/game-dna/compare?a=${scan.id}`}
            className="px-4 py-2 text-sm bg-[#0D1231] border border-white/10 text-white rounded-xl hover:border-white/20 transition-colors"
          >
            Compare
          </Link>
          <button
            onClick={handleExportPdf}
            className="px-4 py-2 text-sm bg-[#FFB81C] text-black font-semibold rounded-xl hover:bg-[#E5A619] transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* 12-variable genome tags */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Genome Profile</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            { label: 'Game Type',     value: genome.gameType },
            { label: 'Target Age',    value: genome.targetAge },
            { label: 'Session',       value: genome.sessionLength },
            { label: 'Monetization',  value: genome.monetizationModel },
            { label: 'Progression',   value: genome.progressionPace },
            { label: 'Zone Density',  value: genome.zoneDensity },
            { label: 'Art Style',     value: genome.artStyle },
            { label: 'Retention',     value: genome.retentionDriver },
            { label: 'Est. DAU',      value: genome.estimatedDau },
            { label: 'Eng. Loop',     value: genome.engagementLoop },
            { label: 'Update Rate',   value: genome.updateCadence },
            { label: 'Community',     value: genome.communitySize },
          ].map((item) => (
            <div key={item.label} className="bg-[#111640] rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm text-white font-medium truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Genome Radar vs Genre Average
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#ffffff15" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
              />
              <Radar
                name={scan.gameName || 'This Game'}
                dataKey="score"
                stroke="#FFB81C"
                fill="#FFB81C"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar
                name="Genre Avg"
                dataKey="average"
                stroke="#60A5FA"
                fill="#60A5FA"
                fillOpacity={0.1}
                strokeWidth={1.5}
                strokeDasharray="4 2"
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Monetization breakdown */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Monetization Breakdown
          </h2>
          <div className="space-y-4">
            {MONETIZATION_ITEMS.map((item) => {
              const rawScore = genome.scores[item.key] ?? 50
              const pct = Math.round(rawScore * item.weight * 2)
              return (
                <MonetizationBar
                  key={item.key}
                  label={item.label}
                  value={Math.min(pct, 100)}
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
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Progression Timeline
        </h2>
        <p className="text-xs text-gray-600 mb-4">
          Estimated player journey milestones over 20 weeks • {genome.progressionPace} pace
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={progressionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0D1231', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: 12 }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
            <Line
              type="monotone"
              dataKey="newPlayer"
              name="New Player Progress %"
              stroke="#FFB81C"
              strokeWidth={2}
              dot={{ fill: '#FFB81C', r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="engaged"
              name="Engaged Player %"
              stroke="#60A5FA"
              strokeWidth={2}
              dot={{ fill: '#60A5FA', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Strategic Recommendations
        </h2>
        <div className="space-y-3">
          {(Array.isArray(genome.recommendations) ? genome.recommendations : []).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 bg-[#111640] rounded-xl px-4 py-3">
              <span className="text-[#FFB81C] text-sm font-bold flex-shrink-0 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-gray-300 text-sm leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

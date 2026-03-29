'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ScanSummary {
  id: string
  gameName: string | null
  robloxUrl: string
  status: string
}

interface GameGenome {
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
  recommendations: string[]
}

interface GameScan {
  id: string
  gameName: string | null
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

const GENOME_TEXT_FIELDS: Array<{ key: keyof GameGenome; label: string }> = [
  { key: 'gameType',          label: 'Game Type' },
  { key: 'targetAge',         label: 'Target Age' },
  { key: 'sessionLength',     label: 'Session Length' },
  { key: 'monetizationModel', label: 'Monetization' },
  { key: 'progressionPace',   label: 'Progression Pace' },
  { key: 'zoneDensity',       label: 'Zone Density' },
  { key: 'artStyle',          label: 'Art Style' },
  { key: 'retentionDriver',   label: 'Retention Driver' },
  { key: 'estimatedDau',      label: 'Est. DAU' },
  { key: 'engagementLoop',    label: 'Engagement Loop' },
  { key: 'updateCadence',     label: 'Update Cadence' },
  { key: 'communitySize',     label: 'Community Size' },
]

// Demo scans shown when API is unavailable
const DEMO_SCANS: ScanSummary[] = [
  { id: 'demo-a', gameName: 'Adopt Me! (Demo)',         robloxUrl: 'https://www.roblox.com/games/920587237', status: 'COMPLETE' },
  { id: 'demo-b', gameName: 'Pet Simulator X (Demo)',   robloxUrl: 'https://www.roblox.com/games/6284583030', status: 'COMPLETE' },
  { id: 'demo-c', gameName: 'Brookhaven (Demo)',        robloxUrl: 'https://www.roblox.com/games/4924922222', status: 'COMPLETE' },
]

const DEMO_SCAN_A: GameScan = {
  id: 'demo-a',
  gameName: 'Adopt Me! (Demo)',
  genome: {
    gameType: 'Social Roleplay', targetAge: '8–12', sessionLength: '45–90 min',
    monetizationModel: 'Cosmetics + Gamepasses', progressionPace: 'Slow Grind',
    zoneDensity: 'High', artStyle: 'Pastel Cartoon', retentionDriver: 'Pet Collection',
    estimatedDau: '500k–1M', engagementLoop: 'Collect → Trade → Flex',
    updateCadence: 'Bi-weekly', communitySize: 'Mega (50M+ visits)',
    scores: {
      game_type: 82, target_age: 90, session_length: 78, monetization_model: 88,
      progression_pace: 65, zone_density: 72, art_style: 85, retention_driver: 91,
      estimated_dau: 95, engagement_loop: 87, update_cadence: 76, community_size: 98,
    },
    recommendations: [],
  },
}

const DEMO_SCAN_B: GameScan = {
  id: 'demo-b',
  gameName: 'Pet Simulator X (Demo)',
  genome: {
    gameType: 'Idle Simulator', targetAge: '10–14', sessionLength: '30–60 min',
    monetizationModel: 'Robux Eggs + Gamepasses', progressionPace: 'Fast Grind',
    zoneDensity: 'Medium', artStyle: 'Stylised 3D', retentionDriver: 'Pet Power Creep',
    estimatedDau: '200k–500k', engagementLoop: 'Collect → Upgrade → Prestige',
    updateCadence: 'Weekly', communitySize: 'Large (10M+ visits)',
    scores: {
      game_type: 74, target_age: 80, session_length: 70, monetization_model: 92,
      progression_pace: 85, zone_density: 65, art_style: 78, retention_driver: 88,
      estimated_dau: 82, engagement_loop: 90, update_cadence: 88, community_size: 85,
    },
    recommendations: [],
  },
}

const DEMO_SCANS_BY_ID: Record<string, GameScan> = {
  'demo-a': DEMO_SCAN_A,
  'demo-b': DEMO_SCAN_B,
}

function ScoreDelta({ a, b }: { a: number; b: number }) {
  const delta = a - b
  if (Math.abs(delta) < 3) return <span className="text-gray-500 text-xs">Tied</span>
  return (
    <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
      {delta > 0 ? `+${delta}` : delta} (Game A {delta > 0 ? 'wins' : 'loses'})
    </span>
  )
}

function CompareContent() {
  const { getToken } = useAuth()
  const searchParams = useSearchParams()
  const initialA = searchParams.get('a') || ''

  const [scans, setScans] = useState<ScanSummary[]>([])
  const [isDemo, setIsDemo] = useState(false)
  const [scanAId, setScanAId] = useState(initialA)
  const [scanBId, setScanBId] = useState('')
  const [scanA, setScanA] = useState<GameScan | null>(null)
  const [scanB, setScanB] = useState<GameScan | null>(null)
  const [loading, setLoading] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Load scan list
  useEffect(() => {
    async function fetchScans() {
      try {
        const token = await getToken()
        const res = await fetch(`${apiUrl}/api/dna/scans`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          setIsDemo(true)
          setScans(DEMO_SCANS)
          return
        }
        const data = await res.json() as { scans: ScanSummary[] }
        const complete = data.scans.filter((s) => s.status === 'COMPLETE')
        if (complete.length === 0) {
          // No real scans yet — seed with demo so the selects aren't empty
          setIsDemo(true)
          setScans(DEMO_SCANS)
        } else {
          setScans(complete)
        }
      } catch {
        // Network error — fall back to demo list
        setIsDemo(true)
        setScans(DEMO_SCANS)
      }
    }
    fetchScans()
  }, [apiUrl, getToken])

  async function loadScan(scanId: string): Promise<GameScan | null> {
    // Return demo data immediately if this is a demo scan
    if (scanId in DEMO_SCANS_BY_ID) {
      return DEMO_SCANS_BY_ID[scanId]
    }
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/api/dna/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return null
      const data = await res.json() as { scan: GameScan }
      return data.scan
    } catch {
      return null
    }
  }

  async function handleCompare() {
    if (!scanAId || !scanBId) return
    setLoading(true)
    const [a, b] = await Promise.all([loadScan(scanAId), loadScan(scanBId)])
    setScanA(a)
    setScanB(b)
    setLoading(false)
  }

  const canCompare = !!scanA && !!scanB && !!scanA.genome && !!scanB.genome

  // Build radar data for comparison
  const radarData = canCompare
    ? Object.entries(GENOME_LABELS).map(([key, name]) => ({
        subject: name,
        a: scanA!.genome!.scores[key] ?? 0,
        b: scanB!.genome!.scores[key] ?? 0,
        fullMark: 100,
      }))
    : []

  // Strategic recommendations based on gaps
  const strategicGaps = canCompare
    ? Object.entries(GENOME_LABELS)
        .map(([key, name]) => ({
          name,
          delta: (scanA!.genome!.scores[key] ?? 0) - (scanB!.genome!.scores[key] ?? 0),
        }))
        .sort((a, b) => a.delta - b.delta)
    : []

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link href="/game-dna" className="text-[#FFB81C] hover:underline text-sm mb-2 inline-block">
          ← Back to scanner
        </Link>
        <h1 className="text-2xl font-bold text-white">Compare Games</h1>
        <p className="text-gray-400 text-sm mt-1">Side-by-side DNA analysis — find where you win and lose</p>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <span className="text-yellow-400 text-sm">Demo</span>
          <p className="text-yellow-400/80 text-sm">
            API unavailable — showing sample games. Connect your backend to compare real scans.
          </p>
        </div>
      )}

      {/* Selector */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Game A</label>
            <select
              value={scanAId}
              onChange={(e) => setScanAId(e.target.value)}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
            >
              <option value="">Select a game…</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.gameName || s.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Game B</label>
            <select
              value={scanBId}
              onChange={(e) => setScanBId(e.target.value)}
              className="w-full bg-[#111640] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FFB81C]/40 transition-colors"
            >
              <option value="">Select a game…</option>
              {scans.filter((s) => s.id !== scanAId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.gameName || s.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleCompare}
          disabled={!scanAId || !scanBId || loading}
          className="bg-[#FFB81C] hover:bg-[#E5A619] disabled:bg-[#FFB81C]/30 disabled:cursor-not-allowed text-black font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Loading…' : 'Compare'}
        </button>
      </div>

      {/* Results */}
      {canCompare && (
        <>
          {/* Radar comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {scanA!.gameName || 'Game A'}
              </h2>
              <p className="text-xs text-gray-600 mb-4">vs Genre Average</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name={scanA!.gameName || 'A'} dataKey="a" stroke="#FFB81C" fill="#FFB81C" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {scanB!.gameName || 'Game B'}
              </h2>
              <p className="text-xs text-gray-600 mb-4">vs Genre Average</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke="#ffffff15" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar name={scanB!.gameName || 'B'} dataKey="b" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Overlay radar */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Overlay Comparison
            </h2>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <Radar name={scanA!.gameName || 'Game A'} dataKey="a" stroke="#FFB81C" fill="#FFB81C" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={scanB!.gameName || 'Game B'} dataKey="b" stroke="#60A5FA" fill="#60A5FA" fillOpacity={0.15} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9CA3AF' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Difference table */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Attribute Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Attribute</th>
                    <th className="text-left px-5 py-3 text-xs text-[#FFB81C] font-medium">
                      {scanA!.gameName || 'Game A'}
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-blue-400 font-medium">
                      {scanB!.gameName || 'Game B'}
                    </th>
                    <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {GENOME_TEXT_FIELDS.map((field) => {
                    const scoreKey = field.key.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`)
                    const scoreA = scanA!.genome!.scores[scoreKey] ?? 0
                    const scoreB = scanB!.genome!.scores[scoreKey] ?? 0
                    const aVal = String(scanA!.genome![field.key] ?? '')
                    const bVal = String(scanB!.genome![field.key] ?? '')

                    return (
                      <tr key={field.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-gray-400">{field.label}</td>
                        <td className="px-5 py-3 text-white">
                          {aVal}
                          <span className="ml-2 text-xs text-gray-600">({scoreA})</span>
                        </td>
                        <td className="px-5 py-3 text-white">
                          {bVal}
                          <span className="ml-2 text-xs text-gray-600">({scoreB})</span>
                        </td>
                        <td className="px-5 py-3">
                          <ScoreDelta a={scoreA} b={scoreB} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Strategic recommendations */}
          <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Strategic Gaps — Where to Improve
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                  {scanA!.gameName || 'Game A'} lags behind in:
                </p>
                <div className="space-y-2">
                  {strategicGaps.slice(0, 4).map(({ name, delta }) => (
                    <div key={name} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-red-300">{name}</span>
                      <span className="text-xs text-red-400 font-semibold">{delta} pts behind</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">
                  {scanA!.gameName || 'Game A'} leads in:
                </p>
                <div className="space-y-2">
                  {[...strategicGaps].reverse().slice(0, 4).map(({ name, delta }) => (
                    <div key={name} className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                      <span className="text-sm text-green-300">{name}</span>
                      <span className="text-xs text-green-400 font-semibold">+{delta} pts ahead</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!canCompare && !loading && (
        <div className="bg-[#0D1231] border border-dashed border-white/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🧬 vs 🧬</div>
          <p className="text-gray-400 text-sm">
            Select two completed scans above to see a side-by-side comparison
          </p>
          {scans.length < 2 && (
            <p className="text-gray-600 text-xs mt-2">
              You need at least 2 completed scans.{' '}
              <Link href="/game-dna" className="text-[#FFB81C] hover:underline">
                Scan more games →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function GameDnaComparePage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm p-8">Loading…</div>}>
      <CompareContent />
    </Suspense>
  )
}

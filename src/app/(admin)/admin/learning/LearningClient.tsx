'use client'

import React, { useEffect, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AILevelData {
  totalXP: number
  level: number
  title: string
  xpToNextLevel: number
  currentLevelXP: number
  streak: number
  bestScore: number
  totalBuilds: number
  rulesLearned: number
}

interface QualityTrend {
  day: string
  avgScore: number
  count: number
}

interface CategoryScore {
  category: string
  avgScore: number
  count: number
}

interface ModelScore {
  model: string
  avgScore: number
  count: number
  bestCategory: string
}

interface LearnedRule {
  rule: string
  confidence: number
  category: string
  createdAt: string
}

interface RecentBuild {
  prompt: string
  score: number
  model: string
  category: string
  userVote: boolean | null
  partCount: number | null
  buildType: string
  createdAt: string
}

interface DashboardData {
  aiLevel: AILevelData
  qualityTrends: QualityTrend[]
  categoryScores: CategoryScore[]
  modelScores: ModelScore[]
  rules: LearnedRule[]
  recentBuilds: RecentBuild[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 75) return '#4ade80'
  if (score >= 50) return '#facc15'
  return '#f87171'
}

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return '#4ade80'
  if (confidence >= 50) return '#facc15'
  return '#f87171'
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toLocaleString()
}

function shortModel(model: string): string {
  if (model.includes('gemini')) return model.replace('models/', '').split('-').slice(0, 2).join('-')
  if (model.includes('groq')) return 'groq'
  if (model.includes('openrouter')) return 'openrouter'
  if (model.length > 20) return model.slice(0, 18) + '..'
  return model
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LearningClient() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/learning')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#B0B0B0] text-sm animate-pulse">Loading AI Learning Dashboard...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-red-400 text-sm">Failed to load: {error || 'Unknown error'}</div>
      </div>
    )
  }

  const { aiLevel, qualityTrends, categoryScores, modelScores, rules, recentBuilds } = data
  const maxTrendCount = Math.max(...qualityTrends.map(t => t.count), 1)
  const xpProgress = aiLevel.xpToNextLevel > 0
    ? (aiLevel.currentLevelXP / (aiLevel.currentLevelXP + aiLevel.xpToNextLevel)) * 100
    : 100

  return (
    <div className="space-y-6 pb-12">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#1a1400] via-[#0f0f0f] to-[#0a0a0a] border border-[#D4AF37]/30 rounded-xl p-6 relative overflow-hidden">
        {/* Gold glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#D4AF37]/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl font-black text-[#D4AF37]">Level {aiLevel.level}</span>
            <span className="text-lg font-semibold text-[#D4AF37]/80">{aiLevel.title}</span>
          </div>

          {/* XP Bar */}
          <div className="mt-3 mb-4">
            <div className="flex justify-between text-xs text-[#B0B0B0] mb-1">
              <span>{formatNumber(aiLevel.totalXP)} total XP</span>
              <span>{formatNumber(aiLevel.xpToNextLevel)} XP to next level</span>
            </div>
            <div className="w-full h-3 bg-[#1c1c1c] rounded-full overflow-hidden border border-[#333]">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.min(100, xpProgress)}%`,
                  background: 'linear-gradient(90deg, #D4AF37, #f5d76e, #D4AF37)',
                  boxShadow: '0 0 12px rgba(212,175,55,0.4)',
                }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox label="Total Builds" value={formatNumber(aiLevel.totalBuilds)} />
            <StatBox label="Rules Learned" value={String(aiLevel.rulesLearned)} />
            <StatBox label="Current Streak" value={`${aiLevel.streak} builds`} accent={aiLevel.streak >= 5} />
            <StatBox label="Best Score" value={`${aiLevel.bestScore}/100`} />
          </div>
        </div>
      </div>

      {/* ── Quality Trends ───────────────────────────────────────────────── */}
      <Section title="Quality Trends (Last 7 Days)">
        {qualityTrends.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No build data in the last 7 days.</p>
        ) : (
          <div className="space-y-2">
            {qualityTrends.map(t => (
              <div key={t.day} className="flex items-center gap-3">
                <span className="text-xs text-[#B0B0B0] w-20 shrink-0 font-mono">
                  {t.day.slice(5)}
                </span>
                <div className="flex-1 h-6 bg-[#1c1c1c] rounded overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{
                      width: `${Math.max(2, t.avgScore)}%`,
                      backgroundColor: scoreColor(t.avgScore),
                      opacity: 0.8,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center pl-2 text-xs font-medium text-white/80">
                    {t.avgScore}/100 avg ({t.count} builds)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Category Performance ─────────────────────────────────────────── */}
      <Section title="Score by Category">
        {categoryScores.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No category data yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categoryScores.map(c => (
              <div key={c.category} className="flex items-center gap-3 bg-[#111] rounded-lg px-3 py-2 border border-[#222]">
                <span className="text-xs text-[#B0B0B0] w-24 shrink-0 truncate capitalize">{c.category}</span>
                <div className="flex-1 h-4 bg-[#1c1c1c] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(3, c.avgScore)}%`,
                      backgroundColor: scoreColor(c.avgScore),
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: scoreColor(c.avgScore) }}>
                  {c.avgScore}
                </span>
                <span className="text-xs text-[#666] shrink-0">{c.count}x</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Model Performance ────────────────────────────────────────────── */}
      <Section title="Model Performance">
        {modelScores.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No model data yet.</p>
        ) : (
          <div className="space-y-2">
            {modelScores.map((m, i) => (
              <div
                key={m.model}
                className="flex items-center gap-3 bg-[#111] rounded-lg px-3 py-2 border border-[#222]"
              >
                <span className="text-xs font-bold text-[#D4AF37] w-4">{i === 0 ? '#1' : `#${i + 1}`}</span>
                <span className="text-xs text-white w-32 shrink-0 truncate font-mono">{shortModel(m.model)}</span>
                <div className="flex-1 h-4 bg-[#1c1c1c] rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${Math.max(3, m.avgScore)}%`,
                      backgroundColor: scoreColor(m.avgScore),
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: scoreColor(m.avgScore) }}>
                  {m.avgScore}
                </span>
                <span className="text-xs text-[#666] shrink-0">{m.count} req</span>
                {m.bestCategory && (
                  <span className="text-xs text-[#D4AF37]/60 shrink-0 hidden sm:inline">
                    best: {m.bestCategory}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Rules Learned ────────────────────────────────────────────────── */}
      <Section title={`Rules Learned (${rules.length})`}>
        {rules.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No rules extracted yet. Build more to teach the AI.</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {rules.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-[#111] rounded-lg px-3 py-2 border border-[#222]"
              >
                <span
                  className="text-xs font-bold shrink-0 mt-0.5 w-8 text-center rounded px-1 py-0.5"
                  style={{
                    color: confidenceColor(r.confidence),
                    backgroundColor: `${confidenceColor(r.confidence)}15`,
                  }}
                >
                  {r.confidence}
                </span>
                <span className="text-xs text-[#ccc] flex-1 leading-relaxed">{r.rule}</span>
                <span className="text-xs text-[#555] shrink-0 capitalize">{r.category}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Recent Builds ────────────────────────────────────────────────── */}
      <Section title="Recent Builds (Last 20)">
        {recentBuilds.length === 0 ? (
          <p className="text-[#B0B0B0] text-sm">No builds recorded yet.</p>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2">
            {recentBuilds.map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-[#111] rounded-lg px-3 py-2 border-l-2"
                style={{ borderLeftColor: scoreColor(b.score) }}
              >
                <span
                  className="text-xs font-bold shrink-0 w-8 text-center"
                  style={{ color: scoreColor(b.score) }}
                >
                  {b.score}
                </span>
                <span className="text-xs text-[#ccc] flex-1 truncate">{b.prompt || '(no prompt)'}</span>
                <span className="text-xs text-[#666] shrink-0 font-mono hidden sm:inline">
                  {shortModel(b.model)}
                </span>
                <span className="text-xs text-[#555] shrink-0 capitalize hidden sm:inline">{b.category}</span>
                {b.userVote === true && <span className="text-green-500 text-xs shrink-0">+1</span>}
                {b.userVote === false && <span className="text-red-500 text-xs shrink-0">-1</span>}
                <span className="text-xs text-[#444] shrink-0">
                  {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-lg px-3 py-2">
      <div className="text-xs text-[#B0B0B0]">{label}</div>
      <div className={`text-lg font-bold ${accent ? 'text-[#D4AF37]' : 'text-white'}`}>{value}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-5">
      <h2 className="text-sm font-bold text-white mb-4 tracking-wide uppercase">{title}</h2>
      {children}
    </div>
  )
}

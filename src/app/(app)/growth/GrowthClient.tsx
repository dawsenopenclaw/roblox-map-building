'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import {
  TrendingUp,
  Users,
  Zap,
  ShoppingBag,
  Link2,
  Copy,
  Check,
  Twitter,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  Star,
  Activity,
  BarChart2,
  Target,
  Lightbulb,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import type { GrowthMetricsResponse } from '@/app/api/growth/metrics/route'
import type { GrowthSuggestionsResponse } from '@/app/api/growth/suggestions/route'

// ─── Helper: derive referral code from userId ──────────────────────────────

function deriveCode(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0
  }
  return `FG-${(hash % 9000 + 1000).toString()}`
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function fmtUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtPct(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

// ─── CSS-only Sparkline ────────────────────────────────────────────────────

type SparklineProps = {
  data: number[]
  color?: string
  height?: number
}

function Sparkline({ data, color = '#D4AF37', height = 32 }: SparklineProps) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = height
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  )
}

// ─── CSS-only Bar Chart ────────────────────────────────────────────────────

type BarChartProps = {
  data: { label: string; value: number; color?: string }[]
  maxValue?: number
}

function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {data.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '90px', textAlign: 'right', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
          <div style={{ flex: 1, height: '8px', background: 'var(--surface-2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: item.color ?? 'var(--gold)',
                borderRadius: '4px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted-subtle)', minWidth: '36px' }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── K-factor history chart ────────────────────────────────────────────────

type KFactorChartProps = {
  history: { week: string; k: number }[]
}

function KFactorChart({ history }: KFactorChartProps) {
  const max = Math.max(...history.map((h) => h.k), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '48px' }}>
      {history.map((item) => (
        <div key={item.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '3px' }}>
          <div
            style={{
              width: '100%',
              height: `${Math.max(4, (item.k / max) * 44)}px`,
              background: item.k >= 1 ? 'var(--gold)' : 'var(--surface-2)',
              borderRadius: '2px',
              transition: 'height 0.5s ease',
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── Trend arrow ──────────────────────────────────────────────────────────

type TrendProps = {
  trend: 'growing' | 'stable' | 'declining' | 'accelerating' | 'decelerating'
  value?: string
}

function Trend({ trend, value }: TrendProps) {
  const config = {
    growing:      { Icon: ArrowUpRight,   color: 'var(--success)', label: value ?? 'Growing' },
    accelerating: { Icon: ArrowUpRight,   color: 'var(--success)', label: value ?? 'Accelerating' },
    stable:       { Icon: Minus,          color: 'var(--muted)',   label: value ?? 'Stable' },
    declining:    { Icon: ArrowDownRight, color: 'var(--error)',   label: value ?? 'Declining' },
    decelerating: { Icon: ArrowDownRight, color: 'var(--warning)', label: value ?? 'Slowing' },
  }
  const { Icon, color, label } = config[trend]
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color, fontSize: '12px', fontWeight: 600 }}>
      <Icon size={13} />
      {label}
    </span>
  )
}

// ─── Metric card ──────────────────────────────────────────────────────────

type MetricCardProps = {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  trend?: TrendProps['trend']
  trendValue?: string
  sparkData?: number[]
  accent?: boolean
}

function MetricCard({ icon, label, value, sub, trend, trendValue, sparkData, accent }: MetricCardProps) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: `1px solid ${accent ? 'rgba(212,175,55,0.3)' : 'var(--border)'}`,
        borderRadius: '12px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px' }}>
          {icon}
          <span>{label}</span>
        </div>
        {sparkData && <Sparkline data={sparkData} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '26px', fontWeight: 700, color: accent ? 'var(--gold)' : 'var(--foreground)', lineHeight: 1 }}>
          {value}
        </span>
        {trend && <Trend trend={trend} value={trendValue} />}
      </div>
      {sub && <span style={{ fontSize: '12px', color: 'var(--muted-subtle)' }}>{sub}</span>}
    </div>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────

function SectionHeading({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <div style={{ color: 'var(--gold)' }}>{icon}</div>
      <div>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>{title}</h2>
        {sub && <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>{sub}</p>}
      </div>
    </div>
  )
}

// ─── Health score ring ────────────────────────────────────────────────────

function HealthRing({ score, grade }: { score: number; grade: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#D4AF37' : score >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={44} cy={44} r={radius} fill="none" stroke="var(--surface-2)" strokeWidth={7} />
        <circle
          cx={44} cy={44} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0px' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color, lineHeight: 1 }}>{grade}</span>
      </div>
    </div>
  )
}

// ─── Pill badge ───────────────────────────────────────────────────────────

function Pill({ label, variant = 'default' }: { label: string; variant?: 'default' | 'gold' | 'green' | 'red' | 'blue' }) {
  const colors: Record<typeof variant, { bg: string; text: string }> = {
    default: { bg: 'var(--surface-2)', text: 'var(--muted)' },
    gold:    { bg: 'rgba(212,175,55,0.12)', text: 'var(--gold)' },
    green:   { bg: 'var(--success-bg)', text: 'var(--success)' },
    red:     { bg: 'var(--error-bg)', text: 'var(--error)' },
    blue:    { bg: 'rgba(96,165,250,0.12)', text: 'var(--blue)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600,
      background: colors[variant].bg, color: colors[variant].text,
    }}>
      {label}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────

export default function GrowthPage() {
  const { user, isLoaded } = useUser()

  const [metrics, setMetrics]         = useState<GrowthMetricsResponse | null>(null)
  const [suggestions, setSuggestions] = useState<GrowthSuggestionsResponse | null>(null)
  const [loading, setLoading]         = useState(true)
  const [linkCopied, setLinkCopied]   = useState(false)
  const [activeTab, setActiveTab]     = useState<'overview' | 'referrals' | 'marketplace' | 'suggestions'>('overview')

  const referralCode = isLoaded && user ? deriveCode(user.id) : '...'
  const referralLink = isLoaded && user
    ? `https://forjegames.com/sign-up?ref=${referralCode}`
    : 'https://forjegames.com/sign-up?ref=...'

  useEffect(() => {
    Promise.all([
      fetch('/api/growth/metrics').then((r) => r.json()).catch(() => null),
      fetch('/api/growth/suggestions').then((r) => r.json()).catch(() => null),
    ]).then(([m, s]) => {
      setMetrics(m)
      setSuggestions(s)
      setLoading(false)
    })
  }, [])

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch { /* clipboard unavailable */ }
  }, [referralLink])

  const shareTwitter = () => {
    const text = `I'm using ForjeGames to build Roblox games with AI — try it free: ${referralLink}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const shareDiscord = () => {
    navigator.clipboard.writeText(referralLink).catch(() => {})
    window.open('https://discord.gg/', '_blank', 'noopener')
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '20px',
  }

  const tabs: { id: typeof activeTab; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'referrals',    label: 'Referrals' },
    { id: 'marketplace',  label: 'Marketplace' },
    { id: 'suggestions',  label: 'AI Suggestions' },
  ]

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ height: '32px', width: '200px', background: 'var(--surface)', borderRadius: '8px', animation: 'pulse 1.4s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '110px', background: 'var(--surface)', borderRadius: '12px', animation: 'pulse 1.4s infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  // API returned null (network failure after loading finished)
  if (!metrics) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={24} color="#EF4444" />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>Growth data unavailable</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
              Could not load metrics. Check your network connection and try again.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              Promise.all([
                fetch('/api/growth/metrics').then((r) => r.json()).catch(() => null),
                fetch('/api/growth/suggestions').then((r) => r.json()).catch(() => null),
              ]).then(([m, s]) => {
                setMetrics(m)
                setSuggestions(s)
                setLoading(false)
              })
            }}
            style={{
              background: 'var(--gold)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const m = metrics
  const s = suggestions

  // Synthetic sparklines
  const dauSpark  = [1200, 1340, 1280, 1510, 1620, 1740, 1842]
  const mauSpark  = [12000, 13400, 14200, 15100, 16200, 17400, 18750]
  const gmvSpark  = [82000, 94000, 87000, 103000, 118000, 124000, 135000]
  const kSpark    = (m?.kFactor.historicalK ?? []).map((h) => h.k)

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--foreground)' }}>Growth Engine</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }}>
            Autonomous growth tracking, referrals, and AI-powered suggestions
            {m?.demo && <span style={{ marginLeft: '8px' }}><Pill label="Demo Data" variant="gold" /></span>}
          </p>
        </div>

        {/* Referral code quick access */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px 14px' }}>
          <Link2 size={14} color="var(--gold)" />
          <code style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.06em' }}>{referralCode}</code>
          <button
            onClick={copyLink}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', minHeight: 'unset', minWidth: 'unset' }}
            aria-label="Copy referral link"
          >
            {linkCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: '13px', fontWeight: 600,
              color: activeTab === tab.id ? 'var(--gold)' : 'var(--muted)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--gold)' : 'transparent'}`,
              marginBottom: '-1px', transition: 'color 0.15s', minHeight: 'unset', minWidth: 'unset',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && m && (
        <>
          {/* Key metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px' }}>
            <MetricCard
              icon={<Users size={14} />}
              label="DAU"
              value={m.dau.toLocaleString()}
              sub={`WAU ${m.wau.toLocaleString()} · MAU ${m.mau.toLocaleString()}`}
              trend="growing"
              trendValue="+8%"
              sparkData={dauSpark}
            />
            <MetricCard
              icon={<Activity size={14} />}
              label="DAU/MAU Ratio"
              value={fmtPct(m.dauMauRatio)}
              sub="Stickiness indicator"
              trend={m.dauMauRatio >= 0.12 ? 'growing' : 'stable'}
              trendValue={m.dauMauRatio >= 0.12 ? 'Sticky' : 'Building'}
            />
            <MetricCard
              icon={<Zap size={14} />}
              label="Token Velocity"
              value={fmtTokens(m.tokenVelocity.totalTokensSpentLast30Days)}
              sub="tokens spent last 30 days"
              trend={m.tokenVelocity.velocityTrend === 'accelerating' ? 'growing' : m.tokenVelocity.velocityTrend === 'decelerating' ? 'declining' : 'stable'}
              trendValue={m.tokenVelocity.velocityTrend}
              sparkData={[2100000, 2400000, 2800000, 3100000, 3500000, 3700000, 3940000].map((v) => v / 1000000)}
              accent
            />
            <MetricCard
              icon={<ShoppingBag size={14} />}
              label="Marketplace GMV"
              value={fmtTokens(m.marketplace.gmvLast30Days)}
              sub={`tokens · ${fmtPct(m.marketplace.gmvGrowthRate)} MoM`}
              trend="growing"
              sparkData={gmvSpark}
            />
            <MetricCard
              icon={<TrendingUp size={14} />}
              label="K-Factor"
              value={m.kFactor.k.toFixed(2)}
              sub={`Viral coeff · ${fmtPct(m.kFactor.conversionRate)} invite conv.`}
              trend={m.kFactor.trend}
              sparkData={kSpark}
              accent={m.kFactor.k >= 1}
            />
            <MetricCard
              icon={<Users size={14} />}
              label="Creator/Consumer"
              value={`1 : ${Math.round(1 / m.creatorConsumerRatio)}`}
              sub={`${m.totalCreators} creators · ${m.totalConsumers.toLocaleString()} consumers`}
              trend="stable"
            />
          </div>

          {/* Retention + New Users row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={card}>
              <SectionHeading icon={<BarChart2 size={15} />} title="Retention Funnel" sub="% of new users who return" />
              <BarChart
                data={[
                  { label: 'Day 1', value: Math.round(m.retentionD1 * 100), color: '#D4AF37' },
                  { label: 'Day 7', value: Math.round(m.retentionD7 * 100), color: '#B8960C' },
                  { label: 'Day 30', value: Math.round(m.retentionD30 * 100), color: '#8A6F00' },
                ]}
                maxValue={100}
              />
            </div>

            <div style={card}>
              <SectionHeading icon={<Users size={15} />} title="New Users" sub="Last 7 days" />
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--foreground)', lineHeight: 1 }}>
                    {m.newUsersLast7Days}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>signups this week</div>
                </div>
                <div style={{ flex: 1 }}>
                  <Sparkline data={[180, 210, 198, 240, 290, 320, 342]} height={48} />
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Pill label={`${m.referral.totalSignupsFromReferrals} via referral`} variant="gold" />
                <Pill label={`${fmtPct(m.referral.conversionRate)} ref conv`} variant="green" />
              </div>
            </div>
          </div>

          {/* K-Factor detail */}
          <div style={card}>
            <SectionHeading
              icon={<TrendingUp size={15} />}
              title={`Viral Coefficient — K = ${m.kFactor.k.toFixed(3)}`}
              sub={`${m.kFactor.invitesSentPerUser.toFixed(2)} invites/user × ${fmtPct(m.kFactor.conversionRate)} conversion · ${m.kFactor.cycleTime}-day cycle`}
            />
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <KFactorChart history={m.kFactor.historicalK} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  {m.kFactor.historicalK.map((h) => (
                    <span key={h.week} style={{ fontSize: '10px', color: 'var(--muted-subtle)' }}>{h.week.replace(' ', '\n')}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                <Trend trend={m.kFactor.trend} />
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {m.kFactor.k >= 1 ? 'Viral growth achieved — K > 1' : `${(1 - m.kFactor.k).toFixed(3)} below viral threshold`}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── REFERRALS TAB ── */}
      {activeTab === 'referrals' && m && (
        <>
          {/* Share card */}
          <div style={{ ...card, border: '1px solid rgba(212,175,55,0.3)' }}>
            <SectionHeading icon={<Link2 size={15} />} title="Your Referral Link" sub="Earn 20% lifetime commission on every paying user you bring" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: linkCopied ? 'var(--success-bg)' : 'rgba(212,175,55,0.12)',
                  border: `1px solid ${linkCopied ? 'var(--success)' : 'rgba(212,175,55,0.3)'}`,
                  color: linkCopied ? 'var(--success)' : 'var(--gold)',
                  padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                {linkCopied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
              </button>
              <button
                onClick={shareTwitter}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(29,161,242,0.12)', border: '1px solid rgba(29,161,242,0.3)', color: '#1DA1F2', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                <Twitter size={14} /> Share
              </button>
              <button
                onClick={shareDiscord}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(88,101,242,0.12)', border: '1px solid rgba(88,101,242,0.3)', color: '#5865F2', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                <MessageCircle size={14} /> Discord
              </button>
            </div>
          </div>

          {/* Referral stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
            <MetricCard icon={<Link2 size={14} />}    label="Links Created"      value={m.referral.totalReferralLinks.toLocaleString()}  sub="across all users" trend="growing" />
            <MetricCard icon={<Users size={14} />}    label="Referral Signups"   value={m.referral.totalSignupsFromReferrals.toLocaleString()} sub={`${fmtPct(m.referral.conversionRate)} conv rate`} trend="growing" />
            <MetricCard icon={<Star size={14} />}     label="Active Referrers"   value={m.referral.activeReferrers.toLocaleString()} sub="sent invite last 30d" trend="stable" />
            <MetricCard icon={<Zap size={14} />}      label="Referral Revenue"   value={fmtUSD(m.referral.revenueFromReferrals)} sub="commissions earned total" trend="growing" accent />
          </div>

          {/* Top referrers leaderboard */}
          {s && (
            <div style={card}>
              <SectionHeading icon={<Star size={15} />} title="Top Referrers" sub="Lifetime paying referrals" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {s.powerUserAlerts.slice(0, 5).map((u, i) => (
                  <div
                    key={u.userId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: '8px',
                      background: i === 0 ? 'rgba(212,175,55,0.06)' : 'transparent',
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--muted-subtle)', minWidth: '20px' }}>
                      #{i + 1}
                    </span>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--muted)', flexShrink: 0 }}>
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-soft)' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>{u.reason}</div>
                    </div>
                    <Pill label={`Score ${u.score}`} variant={i === 0 ? 'gold' : 'default'} />
                    <ChevronRight size={14} color="var(--muted-subtle)" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MARKETPLACE TAB ── */}
      {activeTab === 'marketplace' && m && (
        <>
          {/* Health score */}
          <div style={card}>
            <SectionHeading icon={<Activity size={15} />} title="Marketplace Health" sub="Real-time supply/demand balance" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <HealthRing score={74} grade="B" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <BarChart
                  data={[
                    { label: 'Demand Sat.',    value: 67,  color: '#60A5FA' },
                    { label: 'Creator Ret.',   value: 72,  color: '#10B981' },
                    { label: 'Buyer Ret.',     value: 58,  color: '#D4AF37' },
                    { label: 'Supply Divers.', value: 81,  color: '#8B5CF6' },
                    { label: 'GMV Velocity',   value: 78,  color: '#F59E0B' },
                  ]}
                  maxValue={100}
                />
              </div>
            </div>
          </div>

          {/* Supply gaps */}
          <div style={card}>
            <SectionHeading icon={<AlertCircle size={15} />} title="Supply Gaps" sub="High-demand categories with insufficient supply" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { category: 'GAME_TEMPLATE', keyword: 'simulator template',   demand: 91, supply: 32, opp: 59, earnings: '12,400' },
                { category: 'SCRIPT',        keyword: 'combat system',         demand: 78, supply: 45, opp: 33, earnings: '8,200' },
                { category: 'MAP_TEMPLATE',  keyword: 'city map',              demand: 65, supply: 38, opp: 27, earnings: '6,800' },
                { category: 'UI_KIT',        keyword: 'inventory ui',          demand: 58, supply: 35, opp: 23, earnings: '4,200' },
              ].map((gap) => (
                <div
                  key={gap.keyword}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-soft)' }}>{gap.keyword}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>{gap.category.replace('_', ' ')}</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--blue)' }}>Demand {gap.demand}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>Supply {gap.supply}</span>
                    </div>
                    <div style={{ marginTop: '4px', height: '4px', background: 'var(--surface)', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${gap.demand}%`, background: 'rgba(96,165,250,0.4)', borderRadius: '2px' }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${gap.supply}%`, background: 'var(--gold)', borderRadius: '2px' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gold)' }}>{gap.earnings}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>tokens/mo est.</div>
                    <Pill label={`+${gap.opp} opp`} variant="gold" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category breakdown */}
          <div style={card}>
            <SectionHeading icon={<BarChart2 size={15} />} title="Category Activity" sub="Searches vs purchases last 7 days" />
            <BarChart
              data={[
                { label: 'Game Template', value: 2210, color: '#D4AF37' },
                { label: 'Script',        value: 1840, color: '#60A5FA' },
                { label: 'Map Template',  value: 1590, color: '#10B981' },
                { label: 'UI Kit',        value: 980,  color: '#8B5CF6' },
                { label: 'Asset',         value: 760,  color: '#F59E0B' },
                { label: 'Sound',         value: 430,  color: '#6B7280' },
              ]}
            />
          </div>
        </>
      )}

      {/* ── AI SUGGESTIONS TAB ── */}
      {activeTab === 'suggestions' && s && (
        <>
          {/* What to build */}
          <div style={card}>
            <SectionHeading icon={<Lightbulb size={15} />} title="What to Build Next" sub="Based on marketplace supply gaps — highest opportunity first" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {s.build.slice(0, 4).map((b) => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px', background: 'var(--surface-2)', borderRadius: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground-soft)' }}>{b.title}</span>
                      <Pill label={b.urgency} variant={b.urgency === 'now' ? 'red' : b.urgency === 'this week' ? 'gold' : 'default'} />
                      <Pill label={b.difficulty} variant={b.difficulty === 'easy' ? 'green' : b.difficulty === 'hard' ? 'red' : 'default'} />
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>{b.rationale}</p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {b.keywords.map((kw) => (
                        <Pill key={kw} label={kw} variant="blue" />
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{b.estimatedEarnings}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>est. monthly</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who to target */}
          <div style={card}>
            <SectionHeading icon={<Target size={15} />} title="Who to Target" sub="User segments with highest engagement/conversion potential" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {s.targeting.map((t) => (
                <div key={t.id} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground-soft)' }}>{t.segmentName}</span>
                    <Pill label={t.channel} variant="blue" />
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{t.description}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>{t.estimatedSize.toLocaleString()} users</span>
                    <Pill label={`${fmtPct(t.expectedConversionRate)} conv`} variant="green" />
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--gold)', fontStyle: 'italic' }}>"{t.suggestedMessage}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing + Engagement side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={card}>
              <SectionHeading icon={<Zap size={15} />} title="Pricing Levers" sub="Revenue optimization opportunities" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.pricing.map((p) => (
                  <div key={p.id} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground-soft)' }}>{p.title}</span>
                      <Pill label={p.confidence} variant={p.confidence === 'high' ? 'green' : p.confidence === 'medium' ? 'gold' : 'default'} />
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{p.rationale}</p>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)' }}>{p.estimatedRevenueLift}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <SectionHeading icon={<Clock size={15} />} title="When to Engage" sub="Trigger-based engagement moments" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {s.engagement.map((e) => (
                  <div key={e.id} style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <Pill label={e.channel} variant="blue" />
                      <span style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>{e.timing}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>{e.trigger}</p>
                    <div style={{ fontSize: '11px', color: 'var(--gold)', fontStyle: 'italic' }}>"{e.message}"</div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)' }}>{fmtPct(e.estimatedCTR)} expected CTR</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Power user alerts */}
          <div style={card}>
            <SectionHeading icon={<Star size={15} />} title="Power User Alerts" sub="High-value users who should be personally engaged" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {s.powerUserAlerts.map((u) => (
                <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', background: 'var(--surface-2)' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground-soft)' }}>{u.username}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted-subtle)' }}>{u.reason}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Pill label={u.suggestedAction} variant="gold" />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{u.score}</div>
                    <ArrowUpRight size={14} color="var(--muted-subtle)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  )
}

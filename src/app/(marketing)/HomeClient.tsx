'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Mic, ChevronDown, Folder, Box, Zap, Users, BarChart2, ShoppingBag } from 'lucide-react'

// ---------------------------------------------------------------------------
// Product UI Mockups
// ---------------------------------------------------------------------------

function AppMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/10 bg-[#080B1E] shadow-2xl shadow-black/60">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0D1231] border-b border-white/10">
        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
        <div className="ml-4 flex-1 bg-[#0A0E27] rounded-md px-3 py-1 text-xs text-gray-500 font-mono">
          app.forjegames.com/workspace
        </div>
      </div>

      {/* App layout */}
      <div className="flex" style={{ height: '380px' }}>
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 bg-[#0A0E1F] border-r border-white/10 p-3 flex flex-col">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">My Projects</div>
          {[
            { name: 'City Tycoon v2', status: 'Live', dot: '#27C93F' },
            { name: 'Obby Madness', status: 'Draft', dot: '#FFB81C' },
            { name: 'Pet Simulator', status: 'Building', dot: '#8B5CF6' },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group"
            >
              <Folder className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 flex-shrink-0" />
              <span className="text-xs text-gray-300 truncate flex-1">{p.name}</span>
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: p.dot }}
              />
            </div>
          ))}

          <div className="mt-4 text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2 px-1">Templates</div>
          {['City Map', 'Obby Kit', 'Simulator'].map((t) => (
            <div key={t} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
              <Box className="w-3 h-3 text-gray-600" />
              <span className="text-xs text-gray-500">{t}</span>
            </div>
          ))}

          <div className="mt-auto pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 px-1">
              <div className="w-6 h-6 rounded-full bg-[#FFB81C]/20 border border-[#FFB81C]/40 flex items-center justify-center text-[9px] font-bold text-[#FFB81C]">
                D
              </div>
              <div>
                <div className="text-[10px] text-white font-medium">dawse</div>
                <div className="text-[9px] text-gray-500">Free plan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-[#080B1E]">
            <span className="text-xs text-gray-400">City Tycoon v2</span>
            <span className="text-gray-700">/</span>
            <span className="text-xs text-white">Workspace</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-md px-2 py-1 text-[10px] text-[#FFB81C]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] animate-pulse" />
                Live
              </div>
              <div className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] text-gray-400 hover:text-white cursor-pointer">
                Deploy
              </div>
            </div>
          </div>

          {/* Viewport */}
          <div className="flex-1 relative bg-[#060916] overflow-hidden">
            {/* Grid lines */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            {/* Scene elements — stylized isometric block city */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative" style={{ width: '260px', height: '200px' }}>
                {/* Buildings — simple colored blocks arranged isometrically */}
                {[
                  { left: 20, top: 60, w: 36, h: 70, color: '#1a2040', accent: '#2a3560' },
                  { left: 58, top: 30, w: 44, h: 100, color: '#FFB81C', accent: '#ffd060' },
                  { left: 104, top: 50, w: 40, h: 80, color: '#1e2848', accent: '#2e3d72' },
                  { left: 148, top: 40, w: 34, h: 90, color: '#2a1040', accent: '#4a2070' },
                  { left: 186, top: 65, w: 50, h: 65, color: '#1a2c20', accent: '#2a4830' },
                ].map((b, i) => (
                  <div
                    key={i}
                    className="absolute rounded-sm border"
                    style={{
                      left: b.left,
                      top: b.top,
                      width: b.w,
                      height: b.h,
                      background: `linear-gradient(160deg, ${b.accent}, ${b.color})`,
                      borderColor: `${b.accent}60`,
                    }}
                  />
                ))}
                {/* Ground plane */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-8 rounded-sm"
                  style={{ background: 'linear-gradient(180deg, #1a2040, #0d1228)', border: '1px solid rgba(255,255,255,0.05)' }}
                />
                {/* Selection indicator */}
                <div
                  className="absolute rounded-sm"
                  style={{
                    left: 56,
                    top: 28,
                    width: 48,
                    height: 104,
                    border: '1.5px solid #FFB81C',
                    boxShadow: '0 0 12px rgba(255,184,28,0.25)',
                  }}
                />
              </div>
            </div>

            {/* Inspector panel overlay */}
            <div className="absolute right-2 top-2 w-36 bg-[#0D1231]/90 border border-white/10 rounded-lg p-2.5 backdrop-blur-sm">
              <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Properties</div>
              {[
                { label: 'Name', value: 'Tower_A' },
                { label: 'Height', value: '24 studs' },
                { label: 'Material', value: 'SmoothPlastic' },
              ].map((prop) => (
                <div key={prop.label} className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-gray-500">{prop.label}</span>
                  <span className="text-[9px] text-gray-200 font-mono">{prop.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Command bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0A0E1F] border-t border-white/10">
            <Mic className="w-3.5 h-3.5 text-[#FFB81C] flex-shrink-0" />
            <span className="text-xs text-gray-600 italic flex-1">Type or speak: "Add a medieval castle to the north district..."</span>
            <div className="flex items-center gap-1 text-[10px] text-gray-600">
              <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono">⌘</kbd>
              <kbd className="bg-white/5 border border-white/10 rounded px-1 py-0.5 font-mono">K</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceMockup() {
  return (
    <div className="bg-[#0A0E1F] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Mic className="w-3.5 h-3.5 text-[#FFB81C]" />
        <span className="text-xs font-medium text-white">Voice Command</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#27C93F] animate-pulse" />
      </div>
      <div className="p-4">
        {/* Waveform */}
        <div className="flex items-center justify-center gap-0.5 mb-4 h-10">
          {[4, 8, 14, 6, 20, 10, 18, 8, 12, 16, 6, 20, 10, 14, 8, 4, 16, 10, 6, 18].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-[#FFB81C]"
              style={{ height: `${h}px`, opacity: 0.4 + (h / 20) * 0.6 }}
            />
          ))}
        </div>
        {/* Transcript */}
        <div className="bg-[#080B1E] rounded-lg p-3 mb-3">
          <p className="text-xs text-gray-300 leading-relaxed">
            <span className="text-white">"Build a medieval castle</span> with a moat, drawbridge, and four corner towers in the north district..."
          </p>
        </div>
        {/* Processing */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-[#FFB81C] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 rounded-full bg-[#FFB81C] animate-bounce" style={{ animationDelay: '120ms' }} />
            <div className="w-1 h-1 rounded-full bg-[#FFB81C] animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
          Sourcing 14 marketplace assets...
        </div>
      </div>
    </div>
  )
}

function MarketplaceMockup() {
  const items = [
    { name: 'Medieval Castle', price: 'Free', cat: 'Environment' },
    { name: 'Sci-Fi Hub', price: '120R$', cat: 'Sci-Fi' },
    { name: 'Obby Kit Pro', price: '200R$', cat: 'Platformer' },
    { name: 'City Streets', price: 'Free', cat: 'Urban' },
  ]
  return (
    <div className="bg-[#0A0E1F] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <ShoppingBag className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span className="text-xs font-medium text-white">Asset Marketplace</span>
        <div className="ml-auto bg-[#0A0E27] border border-white/10 rounded-md px-2 py-0.5 text-[10px] text-gray-500">
          12,400+ assets
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.name} className="bg-[#080B1E] border border-white/5 rounded-lg p-2.5 hover:border-white/15 cursor-pointer transition-colors">
            <div className="w-full aspect-video bg-gradient-to-br from-[#1a2040] to-[#0d1228] rounded-md mb-2 flex items-center justify-center">
              <Box className="w-6 h-6 text-gray-700" />
            </div>
            <div className="text-[10px] font-medium text-white truncate">{item.name}</div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[9px] text-gray-600">{item.cat}</span>
              <span className="text-[9px] text-[#FFB81C] font-semibold">{item.price}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GameDNAMockup() {
  const metrics = [
    { label: 'Retention', value: 78, color: '#FFB81C' },
    { label: 'Engagement', value: 91, color: '#8B5CF6' },
    { label: 'Monetization', value: 64, color: '#27C93F' },
    { label: 'Virality', value: 55, color: '#3B82F6' },
  ]
  return (
    <div className="bg-[#0A0E1F] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <BarChart2 className="w-3.5 h-3.5 text-[#27C93F]" />
        <span className="text-xs font-medium text-white">Game DNA Analysis</span>
      </div>
      <div className="p-4">
        <div className="text-[10px] text-gray-500 mb-3">Competitor: Pet Simulator X</div>
        {metrics.map((m) => (
          <div key={m.label} className="mb-2.5">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-gray-400">{m.label}</span>
              <span className="text-[10px] font-mono" style={{ color: m.color }}>{m.value}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${m.value}%`, background: m.color, opacity: 0.8 }}
              />
            </div>
          </div>
        ))}
        <div className="mt-3 bg-[#080B1E] rounded-lg p-2.5">
          <div className="text-[9px] text-[#FFB81C] font-medium mb-1">Recommendation</div>
          <p className="text-[9px] text-gray-400 leading-relaxed">Boost virality with shareable moments and referral rewards. Gap vs top-5 competitors: 18pts.</p>
        </div>
      </div>
    </div>
  )
}

function CollabMockup() {
  const events = [
    { user: 'K', name: 'kai', action: 'placed Castle Tower', time: '2m ago', color: '#8B5CF6' },
    { user: 'M', name: 'maya', action: 'updated terrain shader', time: '5m ago', color: '#3B82F6' },
    { user: 'D', name: 'dawse', action: 'deployed to staging', time: '8m ago', color: '#FFB81C' },
  ]
  return (
    <div className="bg-[#0A0E1F] border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-[#3B82F6]" />
        <span className="text-xs font-medium text-white">Team Activity</span>
        <div className="ml-auto flex -space-x-1">
          {['#FFB81C', '#8B5CF6', '#3B82F6'].map((c, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-[#0A0E1F] flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: c + '40', borderColor: c + '60' }}
            />
          ))}
        </div>
        <span className="text-[10px] text-gray-500">3 online</span>
      </div>
      <div className="p-3 space-y-2">
        {events.map((e) => (
          <div key={e.name} className="flex items-start gap-2.5 p-2 rounded-lg bg-[#080B1E]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
              style={{ background: e.color + '20', color: e.color, border: `1px solid ${e.color}40` }}
            >
              {e.user}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-medium text-white">{e.name}</span>
                <span className="text-[9px] text-gray-600">{e.time}</span>
              </div>
              <p className="text-[9px] text-gray-400 truncate">{e.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TryItSection() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) setSubmitted(true)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-3 bg-[#0D1231] border border-white/15 rounded-xl px-4 py-3.5 focus-within:border-[#FFB81C]/50 transition-colors">
            <Zap className="w-4 h-4 text-[#FFB81C] flex-shrink-0" />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Try: "Build a medieval castle with a moat..."'
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-shrink-0 bg-[#FFB81C] hover:bg-[#E6A519] disabled:bg-white/10 disabled:text-gray-600 text-black font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Build
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-3">No account needed to try. Sign up to save results.</p>
        </form>
      ) : (
        <div className="bg-[#0D1231] border border-[#FFB81C]/30 rounded-xl p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#FFB81C]/10 border border-[#FFB81C]/30 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-5 h-5 text-[#FFB81C]" />
          </div>
          <p className="text-white font-semibold mb-1">Ready to build</p>
          <p className="text-sm text-gray-400 mb-4">
            Your prompt is queued. Create a free account to see results.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  href,
  highlight,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  href: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-6 border flex flex-col ${
        highlight
          ? 'bg-[#FFB81C]/5 border-[#FFB81C]/30'
          : 'bg-[#0A0E1F] border-white/10'
      }`}
    >
      {highlight && (
        <div className="text-[10px] font-bold text-[#FFB81C] uppercase tracking-widest mb-3">Most Popular</div>
      )}
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-300 mb-1">{name}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="text-sm text-gray-500">{period}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">{description}</p>
      </div>
      <ul className="space-y-2.5 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C] mt-1.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`w-full text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          highlight
            ? 'bg-[#FFB81C] hover:bg-[#E6A519] text-black'
            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
        }`}
      >
        {cta}
      </Link>
    </div>
  )
}

function FAQ({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2 max-w-2xl mx-auto">
      {items.map((item, i) => (
        <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-[#0A0E1F]">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-white">{item.q}</span>
            <ChevronDown
              className="w-4 h-4 text-gray-500 flex-shrink-0 transition-transform"
              style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {open === i && (
            <div className="px-5 pb-4">
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFB81C]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Launch badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#FFB81C]/8 border border-[#FFB81C]/20 rounded-full px-4 py-1.5 text-sm text-[#FFB81C]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]" />
              Launching Q2 2026 — Join 200+ creators in early access
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Build Roblox games with
              <br />
              <span className="text-[#FFB81C]">voice and AI</span>
            </h1>
            <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
              Describe your game. ForjeGames sources assets, writes scripts, and assembles a
              playable Roblox scene in minutes — not weeks.
            </p>
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-center gap-3 mb-14">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold px-6 py-3 rounded-lg text-sm transition-colors shadow-lg shadow-[#FFB81C]/15"
            >
              Start building free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
            >
              View pricing
            </Link>
          </div>

          {/* App mockup */}
          <AppMockup />

          <p className="text-center text-xs text-gray-600 mt-4">
            ForjeGames workspace — real product, early access
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Social proof strip                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-white/8 bg-[#0D1231]/40 py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center">
            {[
              { value: '200+', label: 'Creators in early access' },
              { value: '< 5 min', label: 'Average build time' },
              { value: 'Q2 2026', label: 'Public launch' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#FFB81C]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Product showcases                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section id="product" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">The complete Roblox dev platform</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            Everything from voice-to-game to team collaboration, built into one workspace.
          </p>
        </div>

        {/* Row 1: Voice + Marketplace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#FFB81C] uppercase tracking-widest mb-1">Voice Interface</div>
              <h3 className="text-xl font-bold text-white mb-2">Speak your idea, watch it build</h3>
              <p className="text-sm text-gray-400">
                Say "build a medieval castle with a moat" and the AI sources marketplace assets,
                generates terrain, and writes the Luau scripts.
              </p>
            </div>
            <VoiceMockup />
          </div>
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#8B5CF6] uppercase tracking-widest mb-1">Marketplace</div>
              <h3 className="text-xl font-bold text-white mb-2">12,000+ assets, AI-matched</h3>
              <p className="text-sm text-gray-400">
                The AI searches the Roblox marketplace first — sourcing free and paid assets that
                fit your scene before generating anything custom.
              </p>
            </div>
            <MarketplaceMockup />
          </div>
        </div>

        {/* Row 2: Game DNA + Collab */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#27C93F] uppercase tracking-widest mb-1">Game DNA</div>
              <h3 className="text-xl font-bold text-white mb-2">Analyze any competitor game</h3>
              <p className="text-sm text-gray-400">
                Paste a Roblox game URL. Get a full breakdown of retention mechanics, monetization
                hooks, and what to copy or avoid.
              </p>
            </div>
            <GameDNAMockup />
          </div>
          <div>
            <div className="mb-3">
              <div className="text-xs font-semibold text-[#3B82F6] uppercase tracking-widest mb-1">Collaboration</div>
              <h3 className="text-xl font-bold text-white mb-2">Build with your whole team</h3>
              <p className="text-sm text-gray-400">
                Invite teammates, see live edits, and ship with version history — like GitHub, but
                for Roblox scenes.
              </p>
            </div>
            <CollabMockup />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Try it now                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-white/8 bg-[#0D1231]/40 py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Try it now</h2>
          <p className="text-gray-400 text-sm">Describe the game you want to build.</p>
        </div>
        <TryItSection />
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Pricing                                                             */}
      {/* ------------------------------------------------------------------ */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">Straightforward pricing</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            No tokens. No credits. Just build.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <PricingCard
            name="Free"
            price="$0"
            period="/ month"
            description="Get started, no card required."
            features={[
              '3 game builds per month',
              'Marketplace asset search',
              'Voice commands',
              'Deploy to Roblox Studio',
              'Community support',
            ]}
            cta="Start free"
            href="/sign-up"
          />
          <PricingCard
            name="Creator"
            price="$29"
            period="/ month"
            description="For serious solo developers."
            features={[
              'Unlimited game builds',
              'Game DNA competitor analysis',
              'Priority AI queue',
              'Version history (90 days)',
              'Email support',
            ]}
            cta="Start 14-day trial"
            href="/sign-up?plan=creator"
            highlight
          />
          <PricingCard
            name="Studio"
            price="$99"
            period="/ month"
            description="For teams shipping multiple games."
            features={[
              'Everything in Creator',
              'Up to 10 team members',
              'Shared asset library',
              'Analytics dashboard',
              'Priority support + Slack',
            ]}
            cta="Start 14-day trial"
            href="/sign-up?plan=studio"
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-t border-white/8 bg-[#0D1231]/40 py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Common questions</h2>
          </div>
          <FAQ
            items={[
              {
                q: 'Do I need to know how to code?',
                a: 'No. ForjeGames handles all Luau scripting. You describe what you want and the AI builds it. If you do know Luau, you can edit and extend the generated code directly.',
              },
              {
                q: 'How does voice input work?',
                a: 'Click the microphone icon in the workspace and describe your game. The AI transcribes your speech, parses intent, and starts building. Works in any language.',
              },
              {
                q: 'Does this comply with Roblox Terms of Service?',
                a: "Yes. ForjeGames is a third-party development tool — not a bot or exploit. All output is standard Roblox Studio-compatible code and assets.",
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. One-click cancellation in billing settings. No penalties. Your projects stay accessible for 30 days after cancellation.',
              },
              {
                q: 'Is the 14-day trial really free?',
                a: 'Yes. No credit card required for the Free tier. Paid trials require a card to start but you will not be charged until the trial ends — and you can cancel before then.',
              },
            ]}
          />
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA Banner                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start building today
          </h2>
          <p className="text-gray-400 mb-8 text-sm">
            Free account. No credit card. Your first game in under 5 minutes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-semibold px-8 py-3.5 rounded-lg text-sm transition-colors shadow-lg shadow-[#FFB81C]/15"
          >
            Create free account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

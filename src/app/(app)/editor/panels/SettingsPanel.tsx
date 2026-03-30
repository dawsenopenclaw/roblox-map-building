'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface StudioStatus {
  connected: boolean
  placeName?: string
  placeId?: number
  screenshotUrl?: string
  lastActivity?: string
  sessionId?: string
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative flex-shrink-0 w-9 h-5 rounded-full transition-all duration-200 forge-focus"
      style={{
        background: checked
          ? 'linear-gradient(90deg, #D4AF37, #FFB81C)'
          : 'rgba(255,255,255,0.1)',
        boxShadow: checked ? '0 0 8px rgba(255,184,28,0.35)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}

export const SettingsPanel = React.memo(function SettingsPanel({ studioStatus }: { studioStatus: StudioStatus }) {
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave]           = useState(true)
  const [streamingText, setStreamingText] = useState(true)
  const [connectionCode, setConnectionCode] = useState<string | null>(null)
  const [loadingCode, setLoadingCode]       = useState(false)
  const [codeCopied, setCodeCopied]         = useState(false)

  const toggleRows = [
    { label: 'Notifications',  sub: 'Build & asset alerts',        value: notifications, set: setNotifications },
    { label: 'Auto-save',      sub: 'Save sessions automatically', value: autoSave,       set: setAutoSave      },
    { label: 'Streaming text', sub: 'Animated word fade-in',       value: streamingText, set: setStreamingText  },
  ]

  async function handleGenerateCode() {
    setLoadingCode(true)
    try {
      const res = await fetch('/api/studio/auth?action=generate')
      if (res.ok) {
        const data = await res.json() as { code?: string }
        setConnectionCode(data.code ?? null)
      }
    } catch {
      // silently fail — code stays null
    } finally {
      setLoadingCode(false)
    }
  }

  async function handleCopyCode() {
    if (!connectionCode) return
    await navigator.clipboard.writeText(connectionCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  return (
    <div className="p-4 space-y-3" style={{ animation: 'panel-slide-in 0.2s ease-out forwards' }}>

      {/* Studio Connection Section */}
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Studio Connection</p>
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 space-y-3">
        {/* Status row */}
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: studioStatus.connected ? '#10B981' : '#6B7280',
              boxShadow: studioStatus.connected ? '0 0 6px #10B981' : 'none',
              animation: studioStatus.connected ? 'pulse-ring 2s infinite' : 'none',
            }}
          />
          <span className="text-xs font-semibold text-gray-200">
            {studioStatus.connected ? 'Connected' : 'Not Connected'}
          </span>
          {studioStatus.connected && studioStatus.placeName && (
            <span className="text-[10px] text-[#FFB81C] truncate">{studioStatus.placeName}</span>
          )}
        </div>

        {studioStatus.connected && studioStatus.placeId && (
          <div className="text-[10px] text-gray-500">
            Place ID: <span className="text-gray-300 font-mono">{studioStatus.placeId}</span>
          </div>
        )}

        {/* Connection code */}
        <div>
          <p className="text-[10px] text-gray-500 mb-1.5">Plugin connection code</p>
          {connectionCode ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[11px] font-mono text-[#FFB81C] tracking-wider">
                {connectionCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="px-2 py-1.5 rounded text-[10px] font-semibold transition-colors flex-shrink-0"
                style={{
                  background: codeCopied ? 'rgba(74,222,128,0.12)' : 'rgba(255,184,28,0.1)',
                  border: `1px solid ${codeCopied ? 'rgba(74,222,128,0.3)' : 'rgba(255,184,28,0.25)'}`,
                  color: codeCopied ? '#4ADE80' : '#FFB81C',
                }}
              >
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={loadingCode}
              className="w-full py-1.5 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'rgba(255,184,28,0.08)', border: '1px solid rgba(255,184,28,0.2)', color: '#FFB81C' }}
            >
              {loadingCode ? 'Generating...' : 'Generate Connection Code'}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-[10px] text-gray-600 space-y-0.5 leading-relaxed">
          <p>1. Install the ForjeGames plugin from the Creator Store</p>
          <p>2. Open your place in Roblox Studio</p>
          <p>3. Enter this code in the plugin toolbar</p>
        </div>

        {/* Full settings link */}
        <Link
          href="/settings/studio"
          className="forge-focus flex items-center justify-between w-full px-2.5 py-2 rounded-lg text-[10px] font-medium transition-colors group"
          style={{ background: 'rgba(255,184,28,0.04)', border: '1px solid rgba(255,184,28,0.15)' }}
        >
          <span className="text-[#FFB81C]/70 group-hover:text-[#FFB81C] transition-colors">
            Full Studio settings &amp; sessions
          </span>
          <svg className="w-3 h-3 text-[#FFB81C]/40 group-hover:text-[#FFB81C] transition-colors" viewBox="0 0 14 14" fill="none">
            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold pt-1">Preferences</p>

      {/* Theme row — always dark */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.07]">
        <div>
          <p className="text-xs text-gray-200 font-medium">Theme</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Interface color scheme</p>
        </div>
        <span className="text-[11px] font-semibold text-gray-300 bg-white/8 px-2.5 py-1 rounded-md border border-white/10">Dark</span>
      </div>

      {/* Toggle rows */}
      <div className="space-y-1">
        {toggleRows.map(({ label, sub, value, set }) => (
          <div
            key={label}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.025] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-200"
          >
            <div>
              <p className="text-xs text-gray-200 font-medium">{label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
            </div>
            <ToggleSwitch checked={value} onChange={set} />
          </div>
        ))}
      </div>

      {/* Link rows */}
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold pt-1">Account</p>
      <div className="space-y-1">
        {[
          { label: 'Studio',   sub: 'Connect',    href: '/settings/studio' },
          { label: 'API Keys', sub: 'Configure',  href: '/settings/api-keys' },
          { label: 'Account',  sub: 'Manage',     href: '/settings' },
          { label: 'Billing',  sub: 'View',       href: '/billing' },
          { label: 'Help',     sub: 'Docs',       href: '/docs' },
        ].map(({ label, sub, href }) => (
          <Link
            key={label}
            href={href}
            className="forge-focus flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-200 group"
          >
            <span className="text-xs text-gray-300 group-hover:text-gray-100 transition-colors">{label}</span>
            <div className="flex items-center gap-1 text-[#FFB81C]/50 group-hover:text-[#FFB81C] transition-colors duration-200">
              <span className="text-[11px] font-medium">{sub}</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-2 border-t border-white/6">
        <p className="text-[10px] text-gray-700 text-center">ForjeAI v0.1.0</p>
      </div>
    </div>
  )
})

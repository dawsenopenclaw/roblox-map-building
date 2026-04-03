'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Download,
  Monitor,
  Folder,
  Plug,
  ArrowRight,
  Copy,
  Check,
  Shield,
  Zap,
  Undo2,
  RefreshCw,
} from 'lucide-react'

// --- Types -------------------------------------------------------------------

type OS = 'windows' | 'mac'

// --- OS detection ------------------------------------------------------------

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'mac'
  return 'windows'
}

// --- Data --------------------------------------------------------------------

const OS_PATHS: Record<OS, { label: string; path: string; tip: string }> = {
  windows: {
    label: 'Windows',
    path: '%LOCALAPPDATA%\\Roblox\\Plugins\\',
    tip: "Paste this path into File Explorer's address bar to open the folder directly.",
  },
  mac: {
    label: 'Mac',
    path: '~/Documents/Roblox/Plugins/',
    tip: 'In Finder press Cmd + Shift + G and paste the path to jump there.',
  },
}

const FEATURES = [
  {
    icon: <Zap size={18} />,
    title: 'Real-time sync with ForjeGames editor',
    desc: 'Every change in the AI editor appears in Studio instantly — no copy-paste.',
  },
  {
    icon: <Monitor size={18} />,
    title: 'AI-powered map building',
    desc: 'Describe what you want and the AI places, scripts, and configures objects in your place.',
  },
  {
    icon: <Plug size={18} />,
    title: 'Marketplace asset insertion',
    desc: 'Search and insert Roblox marketplace assets directly from the ForjeGames panel.',
  },
  {
    icon: <Undo2 size={18} />,
    title: 'Full undo/redo support',
    desc: "Every AI-generated action integrates with Studio's native history stack.",
  },
  {
    icon: <RefreshCw size={18} />,
    title: 'Auto-reconnect and session persistence',
    desc: 'The plugin reconnects automatically if Studio restarts or your session expires.',
  },
  {
    icon: <Shield size={18} />,
    title: 'Secure connection',
    desc: 'All communication is authenticated with your ForjeGames account — no open ports.',
  },
]

// --- Copy button -------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: copied ? 'rgba(255,184,28,0.15)' : 'rgba(255,184,28,0.08)',
        border: '1px solid rgba(255,184,28,0.25)',
        color: '#FFB81C',
      }}
      aria-label="Copy path"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// --- Main component ----------------------------------------------------------

export default function DownloadClient() {
  const [activeOS, setActiveOS] = useState<OS>('windows')

  useEffect(() => {
    setActiveOS(detectOS())
  }, [])

  const osInfo = OS_PATHS[activeOS]

  return (
    <div
      className="flex flex-col items-center px-6 text-white"
      style={{ paddingTop: 96, paddingBottom: 96 }}
    >
      {/* Hero */}
      <div className="w-full max-w-xl text-center">
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{
            background: 'rgba(255,184,28,0.1)',
            border: '1px solid rgba(255,184,28,0.25)',
            color: '#FFB81C',
          }}
        >
          <Plug size={13} />
          Roblox Studio Plugin
        </div>

        <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          <span style={{ color: '#FFB81C' }}>ForjeGames</span> Studio Plugin
        </h1>

        <p className="mb-8 text-lg leading-relaxed" style={{ color: '#A0AABF' }}>
          Connect Roblox Studio to ForjeGames AI
        </p>

        <a
          href="/plugin/ForjeGames.rbxm"
          download="ForjeGames.rbxm"
          className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold transition-colors"
          style={{ background: '#FFB81C', color: '#000' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E6A519'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFB81C'
          }}
        >
          <Download size={20} />
          Download Plugin
        </a>

        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-sm" style={{ color: '#8B95B0' }}>
            71 KB &bull; .rbxm
          </span>
          <span className="h-4 w-px" style={{ background: '#1A2550' }} aria-hidden />
          <span className="text-sm" style={{ color: '#8B95B0' }}>
            Works with Roblox Studio 2024+
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* Install steps */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#FFB81C' }}
        >
          3-Step Install Guide
        </h2>

        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#FFB81C', color: '#000' }}
            >
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Download size={16} className="shrink-0" style={{ color: '#FFB81C' }} />
                <p className="text-sm font-semibold text-white">Download the .rbxm file</p>
              </div>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                Click the Download Plugin button above to save{' '}
                <code
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{ background: 'rgba(255,184,28,0.1)', color: '#FFB81C' }}
                >
                  ForjeGames.rbxm
                </code>{' '}
                to your computer.
              </p>
              <a
                href="/plugin/ForjeGames.rbxm"
                download="ForjeGames.rbxm"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: 'rgba(255,184,28,0.1)',
                  border: '1px solid rgba(255,184,28,0.3)',
                  color: '#FFB81C',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,184,28,0.18)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,184,28,0.1)'
                }}
              >
                <Download size={14} />
                ForjeGames.rbxm — 71 KB
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#FFB81C', color: '#000' }}
            >
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Folder size={16} className="shrink-0" style={{ color: '#FFB81C' }} />
                <p className="text-sm font-semibold text-white">Place in Plugins folder</p>
              </div>
              <p className="mb-4 text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                Move the downloaded file to the Roblox Plugins folder, then{' '}
                <strong className="font-medium text-white">
                  fully close and reopen Roblox Studio
                </strong>
                .
              </p>

              <div className="mb-3 flex gap-2">
                {(['windows', 'mac'] as OS[]).map((os) => (
                  <button
                    key={os}
                    onClick={() => setActiveOS(os)}
                    className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: activeOS === os ? 'rgba(255,184,28,0.12)' : 'transparent',
                      border: `1px solid ${activeOS === os ? '#FFB81C' : '#1A2550'}`,
                      color: activeOS === os ? '#FFB81C' : '#8B95B0',
                    }}
                  >
                    {OS_PATHS[os].label}
                  </button>
                ))}
              </div>

              <div
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: '#080B1A', border: '1px solid #1A2550' }}
              >
                <code
                  className="min-w-0 flex-1 truncate font-mono text-xs"
                  style={{ color: '#FFB81C' }}
                >
                  {osInfo.path}
                </code>
                <CopyButton text={osInfo.path} />
              </div>
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: '#8B95B0', fontStyle: 'italic' }}
              >
                {osInfo.tip}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#FFB81C', color: '#000' }}
            >
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Plug size={16} className="shrink-0" style={{ color: '#FFB81C' }} />
                <p className="text-sm font-semibold text-white">Connect from Studio</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                Open Roblox Studio and click{' '}
                <strong style={{ color: '#FFB81C' }}>ForjeGames</strong> in the Plugins toolbar.
                Enter your{' '}
                <strong className="font-medium text-white">6-character code</strong> from{' '}
                <Link
                  href="/editor"
                  className="underline underline-offset-2 transition-colors"
                  style={{ color: '#FFB81C' }}
                >
                  forjegames.com/editor
                </Link>{' '}
                to link the session.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* One-click installer */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#FFB81C' }}
        >
          Or install with one command
        </h2>
        <p className="mb-6 text-center text-sm" style={{ color: '#8B95B0' }}>
          Download and place the plugin automatically — no manual folder navigation.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/api/studio/installer?os=win"
            download="install-forjegames.bat"
            className="flex items-center gap-3 rounded-xl px-5 py-4 transition-colors"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFB81C'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1A2550'
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,184,28,0.1)' }}
            >
              <Monitor size={18} style={{ color: '#FFB81C' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Windows Installer</p>
              <p className="mt-0.5 text-xs" style={{ color: '#8B95B0' }}>
                install-forjegames.bat
              </p>
            </div>
            <Download size={16} className="ml-auto shrink-0" style={{ color: '#8B95B0' }} />
          </a>

          <a
            href="/api/studio/installer?os=mac"
            download="install-forjegames.sh"
            className="flex items-center gap-3 rounded-xl px-5 py-4 transition-colors"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFB81C'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1A2550'
            }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(255,184,28,0.1)' }}
            >
              <Monitor size={18} style={{ color: '#FFB81C' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Mac Installer</p>
              <p className="mt-0.5 text-xs" style={{ color: '#8B95B0' }}>
                install-forjegames.sh
              </p>
            </div>
            <Download size={16} className="ml-auto shrink-0" style={{ color: '#8B95B0' }} />
          </a>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* Feature cards */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#FFB81C' }}
        >
          What the plugin does
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl px-5 py-4"
              style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            >
              <span className="mt-0.5 shrink-0" style={{ color: '#FFB81C' }}>
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-medium leading-snug text-white">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#8B95B0' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* Bottom CTA */}
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors"
          style={{ border: '1px solid #1A2550', color: '#A0AABF' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#FFB81C'
            e.currentTarget.style.color = '#FFB81C'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1A2550'
            e.currentTarget.style.color = '#A0AABF'
          }}
        >
          No account yet? Sign up free
          <ArrowRight size={14} />
        </Link>

        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors"
          style={{ background: '#FFB81C', color: '#000' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E6A519'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFB81C'
          }}
        >
          Already installed? Go to editor
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  Terminal,
  Plug,
  Check,
  Copy,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Apple,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OS = 'windows' | 'mac'
type Step = 'download' | 'copy' | 'restart' | 'connect'

interface VerifyStatus {
  state: 'idle' | 'checking' | 'connected' | 'not_connected'
  placeName?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = '#c9a227'
const GOLD_DIM = 'rgba(201,162,39,0.12)'
const GOLD_BORDER = 'rgba(201,162,39,0.28)'
const CARD_BG = '#1a1a1a'
const CARD_BORDER = '#2a2a2a'

const STEPS: { id: Step; label: string }[] = [
  { id: 'download', label: 'Download' },
  { id: 'copy', label: 'Copy' },
  { id: 'restart', label: 'Restart Studio' },
  { id: 'connect', label: 'Connect' },
]

const PS_COMMAND =
  `powershell -NoProfile -ExecutionPolicy Bypass -Command "` +
  `[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12;` +
  `$p=\\\"$env:LOCALAPPDATA\\\\Roblox\\\\Plugins\\\";` +
  `if(!(Test-Path $p)){New-Item -ItemType Directory -Path $p|Out-Null};` +
  `Invoke-WebRequest -Uri 'https://forjegames.com/api/studio/plugin' -OutFile \\\"$p\\\\ForjeGames.rbxmx\\\" -UseBasicParsing;` +
  `Write-Host 'Done! Restart Roblox Studio.'"`

const CURL_COMMAND =
  `curl -sL -o ~/Library/Application\\ Support/Roblox/Plugins/ForjeGames.rbxmx ` +
  `https://forjegames.com/api/studio/plugin && echo "Done! Restart Roblox Studio."`

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows'
  return navigator.userAgent.toLowerCase().includes('mac') ? 'mac' : 'windows'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
      style={{
        background: copied ? 'rgba(201,162,39,0.18)' : GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`,
        color: GOLD,
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
      style={{
        background: done ? '#10b981' : active ? GOLD : '#2a2a2a',
        color: done || active ? '#000' : '#555',
      }}
    >
      {done ? <Check size={14} /> : n}
    </div>
  )
}

function ProgressTracker({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current)

  return (
    <div className="mb-10 flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all"
                style={{
                  background: done ? '#10b981' : active ? GOLD : '#2a2a2a',
                  color: done || active ? '#000' : '#555',
                }}
              >
                {done ? <Check size={11} /> : i + 1}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: active ? GOLD : done ? '#10b981' : '#555' }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="mx-3 mb-5 h-px w-12 transition-colors"
                style={{ background: i < idx ? '#10b981' : '#2a2a2a' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InstallClient() {
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')

  const [os, setOs] = useState<OS>('windows')
  const [currentStep, setCurrentStep] = useState<Step>('download')
  const [verify, setVerify] = useState<VerifyStatus>({ state: 'idle' })
  const [connectionCode, setConnectionCode] = useState<string | null>(null)

  useEffect(() => {
    setOs(detectOS())
  }, [])

  // If userId provided, fetch a pre-generated connection code
  useEffect(() => {
    if (!userId) return
    void fetch(`/api/studio/install?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((d: { code?: string }) => {
        if (d.code) setConnectionCode(d.code)
      })
      .catch(() => {/* silent */})
  }, [userId])

  const handleDownloaded = useCallback(() => setCurrentStep('copy'), [])
  const handleCopied = useCallback(() => setCurrentStep('restart'), [])
  const handleRestarted = useCallback(() => setCurrentStep('connect'), [])

  async function handleVerify() {
    // The install page has no session token — connection state lives in the
    // editor. Redirect there so the user can confirm the plugin is linked.
    window.location.href = '/editor'
  }

  const command = os === 'windows' ? PS_COMMAND : CURL_COMMAND
  const pluginPath =
    os === 'windows'
      ? '%LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.rbxmx'
      : '~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx'
  const folderPath =
    os === 'windows'
      ? '%LOCALAPPDATA%\\Roblox\\Plugins\\'
      : '~/Library/Application Support/Roblox/Plugins/'

  return (
    <div
      className="flex flex-col items-center px-6 text-white"
      style={{ paddingTop: 80, paddingBottom: 96, background: '#0a0a0a', minHeight: '100vh' }}
    >
      {/* Hero */}
      <div className="mb-10 w-full max-w-xl text-center">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}
        >
          <Plug size={12} />
          Plugin Installer
        </div>
        <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Install in{' '}
          <span style={{ color: GOLD }}>60 seconds</span>
        </h1>
        <p className="text-base leading-relaxed" style={{ color: '#888' }}>
          One command installs the plugin directly into Roblox Studio — no manual folder navigation.
        </p>
      </div>

      {/* Progress tracker */}
      <ProgressTracker current={currentStep} />

      {/* OS selector */}
      <div className="mb-8 flex gap-2">
        {(['windows', 'mac'] as OS[]).map((o) => (
          <button
            key={o}
            onClick={() => setOs(o)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
            style={{
              background: os === o ? GOLD_DIM : 'transparent',
              border: `1px solid ${os === o ? GOLD : CARD_BORDER}`,
              color: os === o ? GOLD : '#888',
            }}
          >
            {o === 'windows' ? <Monitor size={14} /> : <Apple size={14} />}
            {o === 'windows' ? 'Windows' : 'macOS'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-2xl space-y-4">
        {/* ---- Step 1: Download ---- */}
        <div
          className="flex gap-5 rounded-2xl px-6 py-6 transition-all"
          style={{
            background: CARD_BG,
            border: `1px solid ${currentStep === 'download' ? GOLD_BORDER : CARD_BORDER}`,
          }}
        >
          <StepBadge n={1} active={currentStep === 'download'} done={STEPS.findIndex((s) => s.id === currentStep) > 0} />
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Download size={15} style={{ color: GOLD }} />
              <p className="text-sm font-semibold text-white">Download the plugin file</p>
            </div>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: '#888' }}>
              Save{' '}
              <code
                className="rounded px-1.5 py-0.5 text-xs"
                style={{ background: GOLD_DIM, color: GOLD }}
              >
                ForjeGames.rbxmx
              </code>{' '}
              — it&apos;s 114 KB and installs in seconds.
            </p>
            <a
              href="/api/studio/plugin"
              download="ForjeGames.rbxmx"
              onClick={handleDownloaded}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
              style={{ background: GOLD, color: '#000' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#e0b82a' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GOLD }}
            >
              <Download size={15} />
              Download ForjeGames.rbxmx
            </a>
          </div>
        </div>

        {/* ---- Step 2: One-liner OR manual copy ---- */}
        <div
          className="flex gap-5 rounded-2xl px-6 py-6 transition-all"
          style={{
            background: CARD_BG,
            border: `1px solid ${currentStep === 'copy' ? GOLD_BORDER : CARD_BORDER}`,
          }}
        >
          <StepBadge
            n={2}
            active={currentStep === 'copy'}
            done={STEPS.findIndex((s) => s.id === currentStep) > 1}
          />
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Terminal size={15} style={{ color: GOLD }} />
              <p className="text-sm font-semibold text-white">
                {os === 'windows' ? 'Run in PowerShell' : 'Run in Terminal'}
              </p>
            </div>
            <p className="mb-3 text-sm leading-relaxed" style={{ color: '#888' }}>
              This one command downloads and places the file automatically — no folder navigation needed.
            </p>

            {/* One-liner command */}
            <div
              className="mb-3 rounded-xl p-4"
              style={{ background: '#0f0f0f', border: `1px solid ${CARD_BORDER}` }}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: '#555' }}>
                  {os === 'windows' ? 'PowerShell (Admin not required)' : 'macOS Terminal'}
                </span>
                <CopyButton text={command} label="Copy command" />
              </div>
              <code
                className="block break-all font-mono text-xs leading-relaxed"
                style={{ color: GOLD }}
              >
                {command}
              </code>
            </div>

            {/* Manual path fallback */}
            <details className="group">
              <summary
                className="cursor-pointer select-none text-xs transition-colors"
                style={{ color: '#555' }}
              >
                Or place the file manually →
              </summary>
              <div className="mt-3 space-y-2">
                <p className="text-xs leading-relaxed" style={{ color: '#888' }}>
                  Move the downloaded file to this exact path:
                </p>
                <div
                  className="flex items-center gap-3 rounded-lg px-4 py-3"
                  style={{ background: '#0f0f0f', border: `1px solid ${CARD_BORDER}` }}
                >
                  <code className="min-w-0 flex-1 truncate font-mono text-xs" style={{ color: GOLD }}>
                    {pluginPath}
                  </code>
                  <CopyButton text={pluginPath} />
                </div>
                <p className="text-xs italic" style={{ color: '#555' }}>
                  {os === 'windows'
                    ? "Paste into File Explorer's address bar to open the folder."
                    : 'In Finder: press Cmd + Shift + G and paste the folder path.'}
                </p>
                <CopyButton text={folderPath} label="Copy folder path" />
              </div>
            </details>

            <button
              onClick={handleCopied}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all"
              style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}
            >
              <Check size={12} />
              Done — file is in the Plugins folder
            </button>
          </div>
        </div>

        {/* ---- Step 3: Restart Studio ---- */}
        <div
          className="flex gap-5 rounded-2xl px-6 py-6 transition-all"
          style={{
            background: CARD_BG,
            border: `1px solid ${currentStep === 'restart' ? GOLD_BORDER : CARD_BORDER}`,
          }}
        >
          <StepBadge
            n={3}
            active={currentStep === 'restart'}
            done={STEPS.findIndex((s) => s.id === currentStep) > 2}
          />
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <RefreshCw size={15} style={{ color: GOLD }} />
              <p className="text-sm font-semibold text-white">Restart Roblox Studio</p>
            </div>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: '#888' }}>
              Studio only loads plugins on startup. Close Studio completely, then reopen it. The{' '}
              <strong className="text-white">ForjeGames</strong> button will appear in the Plugins
              toolbar.
            </p>

            {/* Animated visual hint */}
            <div
              className="flex items-center gap-4 rounded-xl px-5 py-4"
              style={{ background: '#0f0f0f', border: `1px solid ${CARD_BORDER}` }}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: GOLD_DIM }}
              >
                <RefreshCw size={18} style={{ color: GOLD }} />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: '#888' }}>
                <p className="font-semibold text-white">Plugins tab → ForjeGames button</p>
                <p className="mt-0.5">
                  Look for the gold ForjeGames icon in the Plugins ribbon at the top of Studio.
                </p>
              </div>
            </div>

            <button
              onClick={handleRestarted}
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all"
              style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, color: GOLD }}
            >
              <Check size={12} />
              Studio restarted, I see the plugin
            </button>
          </div>
        </div>

        {/* ---- Step 4: Verify + connect ---- */}
        <div
          className="flex gap-5 rounded-2xl px-6 py-6 transition-all"
          style={{
            background: CARD_BG,
            border: `1px solid ${currentStep === 'connect' ? GOLD_BORDER : CARD_BORDER}`,
          }}
        >
          <StepBadge n={4} active={currentStep === 'connect'} done={verify.state === 'connected'} />
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Plug size={15} style={{ color: GOLD }} />
              <p className="text-sm font-semibold text-white">Connect to ForjeGames</p>
            </div>
            <p className="mb-4 text-sm leading-relaxed" style={{ color: '#888' }}>
              In Studio, click the ForjeGames button in the Plugins toolbar. Enter your connection
              code from{' '}
              <Link href="/editor" style={{ color: GOLD }} className="underline underline-offset-2">
                forjegames.com/editor
              </Link>
              .
            </p>

            {/* Pre-generated code (if userId was passed) */}
            {connectionCode && (
              <div
                className="mb-4 flex items-center gap-4 rounded-2xl px-6 py-5"
                style={{ background: '#0f0f0f', border: `2px solid ${GOLD_BORDER}` }}
              >
                <div className="flex-1">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
                    Your connection code
                  </p>
                  <p
                    className="font-mono text-4xl font-bold tracking-[0.25em] text-white"
                  >
                    {connectionCode}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: '#555' }}>
                    Enter this in Roblox Studio → ForjeGames plugin
                  </p>
                </div>
                <CopyButton text={connectionCode} label="Copy code" />
              </div>
            )}

            {/* Verify button */}
            {verify.state === 'connected' ? (
              <div
                className="flex items-center gap-3 rounded-xl px-5 py-4"
                style={{ background: '#0d2b1e', border: '1px solid #10b981' }}
              >
                <CheckCircle2 size={20} style={{ color: '#10b981' }} />
                <div>
                  <p className="text-sm font-bold text-white">
                    Connected{verify.placeName ? ` to "${verify.placeName}"` : ''}!
                  </p>
                  <p className="text-xs" style={{ color: '#6ee7b7' }}>
                    You can now use ForjeGames AI inside Roblox Studio.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => void handleVerify()}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all"
                  style={{ background: GOLD, color: '#000' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e0b82a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = GOLD }}
                >
                  <Plug size={15} />
                  Open Editor to Verify
                </button>
                <span className="text-xs" style={{ color: '#555' }}>
                  Connection state is confirmed in the editor
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-12 w-full max-w-2xl" style={{ borderTop: '1px solid #1a1a1a' }} />

      {/* FAQ */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-6 text-xs font-semibold uppercase tracking-widest"
          style={{ color: GOLD }}
        >
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-xl" style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
              <summary
                className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-white"
              >
                {item.q}
                <ArrowRight
                  size={14}
                  className="shrink-0 transition-transform group-open:rotate-90"
                  style={{ color: GOLD }}
                />
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: '#888' }}>
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row">
        <Link
          href="/download"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all"
          style={{ border: `1px solid ${CARD_BORDER}`, color: '#888' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = CARD_BORDER; e.currentTarget.style.color = '#888' }}
        >
          View full download page
          <ArrowRight size={14} />
        </Link>
        <Link
          href="/editor"
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all"
          style={{ background: GOLD, color: '#000' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e0b82a' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = GOLD }}
        >
          Go to editor
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------

const FAQ: { q: string; a: string }[] = [
  {
    q: "What if the plugin doesn't show up after I restart Studio?",
    a: "Make sure the file is named exactly ForjeGames.rbxmx and is placed directly inside the Plugins folder — not in a sub-folder. Also confirm Studio was fully closed (check Task Manager / Activity Monitor) before reopening.",
  },
  {
    q: 'Do I need to restart Studio after every update?',
    a: 'Only when the plugin file changes. The plugin auto-checks for updates on each Studio launch and notifies you inside the ForjeGames panel when a newer version is available.',
  },
  {
    q: 'Is my data safe? What does the plugin send?',
    a: 'The plugin only sends data you explicitly trigger — AI prompts, place metadata (name, ID), and execute commands you approve. It never reads your account credentials or sends data in the background.',
  },
  {
    q: 'I ran the command but got a permission error.',
    a: "On Windows, right-click PowerShell and choose 'Run as Administrator', then run the command again. On macOS, prefix the curl command with sudo if needed.",
  },
  {
    q: 'Can I install the plugin on multiple computers?',
    a: 'Yes — run the same command on each machine. Your ForjeGames account and connection codes work across devices.',
  },
]

'use client'

import { useState, useEffect, useCallback } from 'react'
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
  CheckCircle2,
  Loader2,
} from 'lucide-react'

// --- Types -------------------------------------------------------------------

type OS = 'windows' | 'mac'
type InstallStatus = 'idle' | 'downloading' | 'saving' | 'done' | 'error' | 'fallback'

// --- Progress steps ----------------------------------------------------------

const PROGRESS_STEPS = ['Download', 'Install', 'Restart Studio', 'Connect'] as const

// --- OS detection ------------------------------------------------------------

function detectOS(): OS {
  if (typeof navigator === 'undefined') return 'windows'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'mac'
  return 'windows'
}

// --- Data --------------------------------------------------------------------

const OS_PATHS: Record<OS, { label: string; folder: string; filePath: string; tip: string }> = {
  windows: {
    label: 'Windows',
    folder: '%LOCALAPPDATA%\\Roblox\\Plugins',
    filePath: '%LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.rbxmx',
    tip: "Paste this path into File Explorer's address bar to open the folder directly.",
  },
  mac: {
    label: 'Mac',
    folder: '~/Library/Application Support/Roblox/Plugins',
    filePath: '~/Library/Application Support/Roblox/Plugins/ForjeGames.rbxmx',
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
        background: copied ? 'rgba(212,175,55,0.15)' : 'rgba(212,175,55,0.08)',
        border: '1px solid rgba(212,175,55,0.25)',
        color: '#D4AF37',
      }}
      aria-label="Copy path"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// --- FAQ data ----------------------------------------------------------------

const FAQ = [
  {
    q: "What if the plugin doesn't show up after I restart Studio?",
    a: 'Make sure the file is named exactly ForjeGames.rbxmx and is inside the Plugins folder directly — not in a sub-folder. Also confirm Studio was fully closed (check Task Manager / Activity Monitor) before reopening.',
  },
  {
    q: 'Do I need to reinstall after every update?',
    a: 'No. The plugin checks for updates automatically and notifies you when a new version is available. Just come back to this page and click Install Plugin — if you\'ve installed before, we remember your Plugins folder and update it instantly. No navigation needed.',
  },
  {
    q: 'Is my data safe? What does the plugin send?',
    a: 'The plugin only sends data you explicitly trigger — AI prompts, place metadata, and commands you approve. It never reads credentials or sends data in the background.',
  },
  {
    q: 'The "Install Plugin" button didn\'t let me pick a folder.',
    a: 'Some browsers (Firefox, Safari) don\'t support the save-to-folder feature. The file downloads to your Downloads folder instead — just move ForjeGames.rbxmx to the Plugins folder shown in Step 1.',
  },
]

// --- IndexedDB helpers for persisting directory handle ----------------------

const IDB_NAME = 'forjegames'
const IDB_STORE = 'handles'
const IDB_KEY = 'pluginsDir'

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY)
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
    db.close()
  } catch { /* IndexedDB not available — no big deal */ }
}

async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIDB()
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY)
    const result = await new Promise<FileSystemDirectoryHandle | null>((res, rej) => {
      req.onsuccess = () => res(req.result ?? null)
      req.onerror = () => rej(req.error)
    })
    db.close()
    return result
  } catch {
    return null
  }
}

// --- File System Access API type helpers ------------------------------------

interface FSAWindow {
  showDirectoryPicker?: (opts?: { id?: string; mode?: string; startIn?: string }) => Promise<FileSystemDirectoryHandle>
}

// --- Main component ----------------------------------------------------------

export default function DownloadClient() {
  const [activeOS, setActiveOS] = useState<OS>('windows')
  const [activeStep, setActiveStep] = useState(0)
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle')
  const [installError, setInstallError] = useState<string | null>(null)
  const [hasSavedDir, setHasSavedDir] = useState(false)

  useEffect(() => {
    setActiveOS(detectOS())
    // Check if we already have a saved Plugins folder handle
    loadDirHandle().then((h) => {
      if (h) setHasSavedDir(true)
    })
  }, [])

  const osInfo = OS_PATHS[activeOS]
  const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  // One-click install: downloads plugin and writes directly to the Plugins folder
  const handleOneClickInstall = useCallback(async () => {
    setInstallStatus('downloading')
    setInstallError(null)
    setActiveStep(0)

    try {
      // Step 1: Download the plugin file
      const res = await fetch('/api/studio/plugin')
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()

      setActiveStep(1)
      setInstallStatus('saving')

      // Step 2: Try to use a previously saved directory handle (zero-click re-install)
      const savedHandle = await loadDirHandle()
      if (savedHandle) {
        try {
          // Verify we still have permission
          const perm = await savedHandle.requestPermission({ mode: 'readwrite' } as unknown as FileSystemHandlePermissionDescriptor)
          if (perm === 'granted') {
            const fileHandle = await savedHandle.getFileHandle('ForjeGames.rbxmx', { create: true })
            const writable = await fileHandle.createWritable()
            await writable.write(blob)
            await writable.close()

            setInstallStatus('done')
            setActiveStep(2)
            return
          }
          // Permission not granted — need to re-pick
          setHasSavedDir(false)
        } catch {
          // Permission revoked or handle stale — fall through to picker
          setHasSavedDir(false)
        }
      }

      // Step 3: Ask user to pick their Plugins folder (first time only)
      if (supportsDirectoryPicker) {
        try {
          const win = window as unknown as FSAWindow
          const dirHandle = await win.showDirectoryPicker!({
            id: 'roblox-plugins',
            mode: 'readwrite',
          })

          // Write the plugin file directly into the picked folder
          const fileHandle = await dirHandle.getFileHandle('ForjeGames.rbxmx', { create: true })
          const writable = await fileHandle.createWritable()
          await writable.write(blob)
          await writable.close()

          // Save the directory handle for future zero-click installs
          await saveDirHandle(dirHandle)
          setHasSavedDir(true)

          setInstallStatus('done')
          setActiveStep(2)
          return
        } catch (e) {
          // User cancelled the picker
          if (e instanceof DOMException && e.name === 'AbortError') {
            setInstallStatus('idle')
            setActiveStep(0)
            return
          }
          // Permission denied or other error — fall through to regular download
        }
      }

      // Fallback: trigger a regular browser download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ForjeGames.rbxmx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setInstallStatus('fallback')
      setActiveStep(1)
    } catch (err) {
      setInstallStatus('error')
      setInstallError(err instanceof Error ? err.message : 'Download failed')
    }
  }, [supportsDirectoryPicker])

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
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.25)',
            color: '#D4AF37',
          }}
        >
          <Plug size={13} />
          Roblox Studio Plugin
        </div>

        <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          <span style={{ color: '#D4AF37' }}>ForjeGames</span> Studio Plugin
        </h1>

        <p className="mb-8 text-lg leading-relaxed" style={{ color: '#A0AABF' }}>
          Connect Roblox Studio to ForjeGames AI — one click to install
        </p>

        <button
          onClick={handleOneClickInstall}
          disabled={installStatus === 'downloading' || installStatus === 'saving'}
          className="inline-flex items-center gap-2.5 rounded-xl px-8 py-4 text-base font-bold transition-all disabled:opacity-70"
          style={{ background: installStatus === 'done' ? '#10b981' : '#D4AF37', color: '#000' }}
          onMouseEnter={(e) => {
            if (installStatus !== 'done' && installStatus !== 'downloading' && installStatus !== 'saving')
              e.currentTarget.style.background = '#E6A519'
          }}
          onMouseLeave={(e) => {
            if (installStatus === 'done') e.currentTarget.style.background = '#10b981'
            else if (installStatus !== 'downloading' && installStatus !== 'saving')
              e.currentTarget.style.background = '#D4AF37'
          }}
        >
          {installStatus === 'downloading' && (
            <>
              <Loader2 size={20} className="animate-spin" />
              Downloading...
            </>
          )}
          {installStatus === 'saving' && (
            <>
              <Loader2 size={20} className="animate-spin" />
              {hasSavedDir ? 'Installing...' : 'Select your Plugins folder...'}
            </>
          )}
          {installStatus === 'done' && (
            <>
              <Check size={20} />
              Installed — Restart Studio
            </>
          )}
          {installStatus === 'error' && (
            <>
              <Download size={20} />
              Try Again
            </>
          )}
          {(installStatus === 'idle' || installStatus === 'fallback') && (
            <>
              <Download size={20} />
              Install Plugin
            </>
          )}
        </button>

        {installStatus === 'done' && (
          <p className="mt-3 text-sm font-medium" style={{ color: '#10b981' }}>
            Plugin saved. Close and reopen Roblox Studio to activate it.
          </p>
        )}

        {installStatus === 'fallback' && (
          <p className="mt-3 text-sm" style={{ color: '#f59e0b' }}>
            Downloaded! Move <strong>ForjeGames.rbxmx</strong> from your Downloads to the Plugins folder below.
          </p>
        )}

        {installStatus === 'error' && installError && (
          <p className="mt-3 text-sm" style={{ color: '#ef4444' }}>
            {installError}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-sm" style={{ color: '#8B95B0' }}>
            ~200 KB &bull; .rbxmx
          </span>
          <span className="h-4 w-px" style={{ background: '#1A2550' }} aria-hidden />
          <span className="text-sm" style={{ color: '#8B95B0' }}>
            Works with Roblox Studio 2024+
          </span>
          <span className="h-4 w-px" style={{ background: '#1A2550' }} aria-hidden />
          <span className="text-sm" style={{ color: '#8B95B0' }}>
            Auto-updates
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* Progress tracker */}
      <div className="mb-10 w-full max-w-2xl">
        <h2
          className="mb-6 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
        >
          Installation progress
        </h2>
        <div className="flex items-center justify-center">
          {PROGRESS_STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => setActiveStep(i)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all"
                  style={{
                    background: i < activeStep ? '#10b981' : i === activeStep ? '#D4AF37' : '#1A2550',
                    color: i <= activeStep ? '#000' : '#8B95B0',
                  }}
                >
                  {i < activeStep ? <Check size={13} /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: i === activeStep ? '#D4AF37' : i < activeStep ? '#10b981' : '#8B95B0',
                  }}
                >
                  {label}
                </span>
              </button>
              {i < PROGRESS_STEPS.length - 1 && (
                <div
                  className="mx-3 mb-5 h-px w-10 transition-colors"
                  style={{ background: i < activeStep ? '#10b981' : '#1A2550' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
        >
          How it works
        </h2>

        <div className="flex flex-col gap-4">
          {/* Step 1 — Install */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{
              background: installStatus === 'done' ? 'rgba(16,185,129,0.05)' : '#0F1535',
              border: `1px solid ${installStatus === 'done' ? 'rgba(16,185,129,0.3)' : '#1A2550'}`,
            }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{
                background: installStatus === 'done' ? '#10b981' : '#D4AF37',
                color: '#000',
              }}
            >
              {installStatus === 'done' ? <Check size={13} /> : '1'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Download size={16} className="shrink-0" style={{ color: installStatus === 'done' ? '#10b981' : '#D4AF37' }} />
                <p className="text-sm font-semibold text-white">
                  {installStatus === 'done' ? 'Plugin installed' : 'Click "Install Plugin" above'}
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                {installStatus === 'done' ? (
                  'Plugin file saved directly to your Plugins folder. No copying needed.'
                ) : installStatus === 'fallback' ? (
                  <>
                    Move the downloaded <code className="rounded px-1 py-0.5 text-xs" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37' }}>ForjeGames.rbxmx</code> to your Plugins folder:
                  </>
                ) : hasSavedDir ? (
                  <>
                    Click <strong className="text-white">Install Plugin</strong> above — we&apos;ll place the file directly in your Plugins folder. No navigation needed.
                  </>
                ) : (
                  <>
                    Click the button above. Your browser will ask you to select your Roblox <strong className="text-white">Plugins</strong> folder. Navigate to the path below and select it — we&apos;ll remember it for future updates.
                  </>
                )}
              </p>

              {(installStatus !== 'done') && (
                <div className="mt-4">
                  <div className="mb-3 flex gap-2">
                    {(['windows', 'mac'] as OS[]).map((os) => (
                      <button
                        key={os}
                        onClick={() => setActiveOS(os)}
                        className="rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: activeOS === os ? 'rgba(212,175,55,0.12)' : 'transparent',
                          border: `1px solid ${activeOS === os ? '#D4AF37' : '#1A2550'}`,
                          color: activeOS === os ? '#D4AF37' : '#8B95B0',
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
                    <Folder size={14} className="shrink-0" style={{ color: '#D4AF37' }} />
                    <code
                      className="min-w-0 flex-1 truncate font-mono text-xs"
                      style={{ color: '#D4AF37' }}
                    >
                      {installStatus === 'fallback' ? osInfo.filePath : osInfo.folder}
                    </code>
                    <CopyButton text={installStatus === 'fallback' ? osInfo.filePath : osInfo.folder} />
                  </div>
                  <p
                    className="mt-2 text-xs leading-relaxed"
                    style={{ color: '#8B95B0', fontStyle: 'italic' }}
                  >
                    {osInfo.tip}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2 — Restart Studio */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#D4AF37', color: '#000' }}
            >
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <RefreshCw size={16} className="shrink-0" style={{ color: '#D4AF37' }} />
                <p className="text-sm font-semibold text-white">Restart Roblox Studio</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                <strong className="font-medium text-white">Fully close</strong> Roblox Studio and reopen it.
                The plugin loads on startup — you&apos;ll see <strong style={{ color: '#D4AF37' }}>ForjeGames</strong> in the Plugins toolbar.
              </p>
            </div>
          </div>

          {/* Step 3 — Connect */}
          <div
            className="flex gap-5 rounded-2xl px-6 py-6"
            style={{ background: '#0F1535', border: '1px solid #1A2550' }}
          >
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ background: '#D4AF37', color: '#000' }}
            >
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <Plug size={16} className="shrink-0" style={{ color: '#D4AF37' }} />
                <p className="text-sm font-semibold text-white">Connect from Studio</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#8B95B0' }}>
                Click <strong style={{ color: '#D4AF37' }}>ForjeGames</strong> in the Plugins toolbar,
                enter your <strong className="font-medium text-white">6-character code</strong> from{' '}
                <Link
                  href="/editor"
                  className="underline underline-offset-2 transition-colors"
                  style={{ color: '#D4AF37' }}
                >
                  forjegames.com/editor
                </Link>{' '}
                and you&apos;re connected. Future updates install automatically.
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

      {/* Feature cards */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-8 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
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
              <span className="mt-0.5 shrink-0" style={{ color: '#D4AF37' }}>
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

      {/* Verify Installation */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-2 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
        >
          Verify Installation
        </h2>
        <p className="mb-6 text-center text-sm" style={{ color: '#8B95B0' }}>
          Not sure if the plugin loaded? Check these three things.
        </p>
        <div className="flex flex-col gap-3">
          {[
            {
              label: 'Plugin file is in the right place',
              detail:
                activeOS === 'windows'
                  ? 'Open File Explorer and navigate to %LOCALAPPDATA%\\Roblox\\Plugins\\ — you should see ForjeGames.rbxmx listed there.'
                  : 'Open Finder, press Cmd + Shift + G, paste ~/Library/Application Support/Roblox/Plugins/ — ForjeGames.rbxmx should be listed.',
            },
            {
              label: 'Roblox Studio was fully restarted after install',
              detail:
                'Studio only loads plugins on startup. If you placed the file while Studio was open, close it completely and reopen it.',
            },
            {
              label: 'ForjeGames button appears in the Plugins toolbar',
              detail:
                'In Studio, click the Plugins tab in the top ribbon. You should see a ForjeGames button. Click it to open the connection panel.',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex gap-4 rounded-xl px-5 py-4"
              style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            >
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: '#D4AF37' }}
              />
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#8B95B0' }}>
                  {item.detail}
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

      {/* Animated demo placeholder */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-6 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
        >
          See how it works
        </h2>
        <div
          className="flex items-center justify-center rounded-2xl"
          style={{
            background: '#0F1535',
            border: '1px solid #1A2550',
            height: 280,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated shimmer bars simulating a GIF placeholder */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)' }}
            >
              <Plug size={28} style={{ color: '#D4AF37' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Connection flow demo</p>
              <p className="mt-1 text-xs" style={{ color: '#8B95B0' }}>
                Plugin connects to the ForjeGames editor in real time — instant two-way sync
              </p>
            </div>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(212,175,55,0.1)',
                border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37',
              }}
            >
              Open the editor
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-14 w-full max-w-2xl"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* FAQ */}
      <div className="w-full max-w-2xl">
        <h2
          className="mb-6 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#D4AF37' }}
        >
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl"
              style={{ background: '#0F1535', border: '1px solid #1A2550' }}
            >
              <summary
                className="flex cursor-pointer select-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium text-white"
              >
                {item.q}
                <ArrowRight
                  size={14}
                  className="shrink-0 transition-transform group-open:rotate-90"
                  style={{ color: '#D4AF37' }}
                />
              </summary>
              <div
                className="px-5 pb-5 text-sm leading-relaxed"
                style={{ color: '#8B95B0' }}
              >
                {item.a}
              </div>
            </details>
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
            e.currentTarget.style.borderColor = '#D4AF37'
            e.currentTarget.style.color = '#D4AF37'
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
          style={{ background: '#D4AF37', color: '#000' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#E6A519'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#D4AF37'
          }}
        >
          Already installed? Go to editor
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

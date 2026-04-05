'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ScreenshotResponse {
  connected: boolean
  url: string | null
  base64: string | null
  capturedAt: number | null
}

interface ViewportProps {
  /** If true, poll is skipped and mock viewport is always shown */
  forceDemo?: boolean
  /** Fired when an object in the viewport is clicked (future: overlay click zones) */
  onObjectClick?: (objectId: string) => void
  className?: string
}

// ---------------------------------------------------------------------------
// Mock grid — shown when not connected
// ---------------------------------------------------------------------------
function ViewportGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-25"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="vp-small" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#2A3060" strokeWidth="0.5" />
        </pattern>
        <pattern id="vp-large" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#vp-small)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#3A4070" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#vp-large)" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Viewport component
// ---------------------------------------------------------------------------
export function Viewport({ forceDemo = false, onObjectClick: _onObjectClick, className = '' }: ViewportProps) {
  const [screenshot, setScreenshot] = useState<ScreenshotResponse | null>(null)
  const [error, setError] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll every 2 seconds when not in demo mode
  useEffect(() => {
    if (forceDemo) return

    async function fetchScreenshot() {
      try {
        const res = await fetch('/api/studio/screenshot', { credentials: 'include' })
        if (!res.ok) {
          setError(true)
          return
        }
        const data = (await res.json()) as ScreenshotResponse
        setScreenshot(data)
        setError(false)
      } catch {
        setError(true)
      }
    }

    // Immediate first fetch
    void fetchScreenshot()

    intervalRef.current = setInterval(() => {
      void fetchScreenshot()
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [forceDemo])

  const isConnected = !forceDemo && !error && screenshot?.connected === true
  const imageSrc = isConnected
    ? screenshot?.url ?? (screenshot?.base64 ? `data:image/png;base64,${screenshot.base64}` : null)
    : null

  return (
    <div className={`relative w-full h-full bg-[#080B16] overflow-hidden flex items-center justify-center ${className}`}>

      {/* Grid background always visible */}
      <ViewportGrid />

      {isConnected && imageSrc ? (
        /* ── Live screenshot from Studio ─────────────────────────────────── */
        <>
          <Image
            src={imageSrc}
            alt="Live Roblox Studio viewport showing game build preview"
            fill
            unoptimized
            className="object-contain z-10"
            draggable={false}
          />

          {/* Connected badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-green-500/30 text-xs text-green-400 font-medium select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            Connected to Studio
          </div>

          {/* Timestamp */}
          {screenshot?.capturedAt && (
            <div className="absolute bottom-2 right-3 z-20 text-gray-700 text-xs font-mono pointer-events-none">
              {new Date(screenshot.capturedAt * 1000).toLocaleTimeString()}
            </div>
          )}
        </>
      ) : (
        /* ── Disconnected / demo state ────────────────────────────────────── */
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 select-none">
          {/* Studio icon */}
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
          </div>

          <h3 className="text-white text-sm font-semibold mb-1">
            Connect Roblox Studio to see live preview
          </h3>
          <p className="text-gray-500 text-xs mb-4 max-w-xs leading-relaxed">
            Install the ForjeGames plugin in Roblox Studio and your game will appear here in real-time.
          </p>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-left text-xs space-y-1.5 w-full max-w-xs">
            <p className="text-gray-300 font-medium mb-2">How to connect:</p>
            <p className="text-gray-400">
              <span className="text-[#D4AF37] font-mono mr-1.5">1.</span>
              Open Roblox Studio
            </p>
            <p className="text-gray-400">
              <span className="text-[#D4AF37] font-mono mr-1.5">2.</span>
              Install the ForjeGames plugin
            </p>
            <p className="text-gray-400">
              <span className="text-[#D4AF37] font-mono mr-1.5">3.</span>
              Click "Connect" in the plugin toolbar
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

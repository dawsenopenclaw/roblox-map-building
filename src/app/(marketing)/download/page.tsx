'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type OS = 'windows' | 'mac' | 'linux' | 'unknown'

const DOWNLOADS = {
  windows: {
    label: 'Download for Windows',
    url: '/downloads/ForjeGames-Setup-1.0.0.exe',
    ext: '.exe',
  },
  mac: {
    label: 'Download for macOS',
    url: '/downloads/ForjeGames-1.0.0.dmg',
    ext: '.dmg',
  },
  linux: {
    label: 'Download for Linux',
    url: '/downloads/ForjeGames-1.0.0.AppImage',
    ext: '.AppImage',
  },
}

function detectOS(): OS {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('linux')) return 'linux'
  return 'unknown'
}

const OS_LABELS: Record<string, string> = {
  windows: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
}

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<OS>('windows')

  useEffect(() => {
    setDetectedOS(detectOS())
  }, [])

  const primary = DOWNLOADS[detectedOS as keyof typeof DOWNLOADS] ?? DOWNLOADS.windows
  const others = (Object.keys(DOWNLOADS) as OS[]).filter((k) => k !== detectedOS)

  return (
    <div className="flex flex-col items-center px-6 py-20 text-white">
      {/* Hero */}
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span style={{ color: '#FFB81C' }}>Forje</span>Games Desktop
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed">
          Build Roblox games with AI — directly connected to Studio.
        </p>
      </div>

      {/* Primary download */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <a
          href={primary.url}
          className="inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#FFB81C22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB81C]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {primary.label}
        </a>
        <p className="text-gray-500 text-sm">v1.0.0 · 220MB · Signed</p>
      </div>

      {/* Other platforms */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-gray-500 text-sm">Or download for:</span>
        {others.map((os) => (
          <a
            key={os}
            href={DOWNLOADS[os].url}
            className="text-sm text-gray-300 hover:text-[#FFB81C] underline underline-offset-4 decoration-gray-600 hover:decoration-[#FFB81C] transition-colors"
          >
            {OS_LABELS[os]}
          </a>
        ))}
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl border-t border-white/10 my-12" />

      {/* Features + Requirements */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-10">
        <div>
          <h2 className="text-sm font-semibold text-[#FFB81C] uppercase tracking-wider mb-4">
            What you get
          </h2>
          <ul className="space-y-3">
            {[
              'Direct connection to Roblox Studio',
              'AI builds your game as you chat',
              'Offline mode — build without internet',
              'Auto-installs the Studio plugin',
              '1,000 free tokens',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-[#FFB81C] mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#FFB81C] uppercase tracking-wider mb-4">
            System Requirements
          </h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>Windows 10+ / macOS 11+ / Ubuntu 20.04+</li>
            <li>4GB RAM minimum, 8GB recommended</li>
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full max-w-2xl border-t border-white/10 my-12" />

      {/* Web fallback */}
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-3">Don't want to download?</p>
        <Link
          href="/editor"
          className="text-sm text-gray-300 hover:text-[#FFB81C] underline underline-offset-4 decoration-gray-600 hover:decoration-[#FFB81C] transition-colors"
        >
          Use web version →
        </Link>
      </div>
    </div>
  )
}

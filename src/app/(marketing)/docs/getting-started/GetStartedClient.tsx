'use client'

import { useState } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    id: 'account',
    number: '01',
    title: 'Create your account',
    description:
      'Sign up with email, Google, or Discord. Under-13 users complete a parental consent flow — COPPA compliant by default. No credit card required.',
    anchor: 'account',
    code: null,
    note: 'Demo mode is available at forjegames.com/editor — try the editor without an account. Sessions are limited to 5 AI requests.',
    visual: {
      label: 'Sign-up screen',
      lines: [
        'ForjeGames',
        '──────────────────',
        'Continue with Google   ▶',
        'Continue with Discord  ▶',
        '──────────────────',
        'Email address',
        '[you@example.com    ]',
        '[Create account →   ]',
      ],
    },
  },
  {
    id: 'editor',
    number: '02',
    title: 'Open the editor',
    description:
      'The ForjeGames editor is a 50/50 split pane. Left side: AI chat. Right side: live 3D preview of your Roblox map as it builds.',
    anchor: 'editor',
    code: null,
    note: 'Keyboard shortcut: press Cmd/Ctrl + K to open the command palette from anywhere in the editor.',
    visual: {
      label: 'Editor layout',
      lines: [
        '┌─────────────┬─────────────┐',
        '│  AI Chat    │  3D Preview │',
        '│             │             │',
        '│  > Build a  │  [map render│',
        '│    medieval │   loading…] │',
        '│    castle   │             │',
        '│             │             │',
        '└─────────────┴─────────────┘',
      ],
    },
  },
  {
    id: 'command',
    number: '03',
    title: 'Type your first command',
    description:
      'Describe your game in plain English. ForjeGames routes your request to the best-fit agent from its 55-agent pool and streams the output live.',
    anchor: 'command',
    code: {
      lang: 'plaintext',
      label: 'Example prompts',
      body: `Build a medieval castle with working gates and torches

Generate a zombie survival map with 5 safe zones and fog

Create a pet simulator with egg hatching, inventory, and trading

Write a leaderboard script that saves data across sessions`,
    },
    note: null,
    visual: null,
  },
  {
    id: 'voice',
    number: '04',
    title: 'Try Voice Commands (optional)',
    description:
      'Click the microphone icon in the editor toolbar. Speak any command — the same prompts that work in chat work via voice. Hands-free building.',
    anchor: 'voice',
    code: {
      lang: 'plaintext',
      label: 'Voice command examples',
      body: `"Add ambient lighting to my map"
"Increase the mountain height by 20 studs"
"Generate a shop NPC with a dialogue tree"
"Export the current script to my clipboard"`,
    },
    note: 'Voice Commands require microphone permission in your browser. Chrome and Edge give the best accuracy.',
    visual: null,
  },
  {
    id: 'studio',
    number: '05',
    title: 'Connect Roblox Studio (optional)',
    description:
      'Install the ForjeGames Studio Plugin from the Roblox Creator Marketplace. It opens a sidebar in Studio that syncs AI output directly into your place file — no copy-paste.',
    anchor: 'studio',
    code: {
      lang: 'bash',
      label: 'Plugin install (one-time)',
      body: `-- In Roblox Studio:
-- Plugins → Manage Plugins → Search "ForjeGames"
-- Click Install → Restart Studio
-- A ForjeGames sidebar appears on the right`,
    },
    note: null,
    visual: null,
  },
  {
    id: 'publish',
    number: '06',
    title: 'Publish your game',
    description:
      'Hit the Publish button in the editor. ForjeGames uses the Roblox Open Cloud API to push your place file directly to your Roblox account. The game is live in seconds.',
    anchor: 'publish',
    code: {
      lang: 'json',
      label: 'Publish response',
      body: `{
  "success": true,
  "placeId": 12345678901,
  "universeId": 9876543210,
  "url": "https://www.roblox.com/games/12345678901",
  "publishedAt": "2026-03-29T12:00:00Z"
}`,
    },
    note: 'Publishing requires a linked Roblox account. Go to Settings → Integrations → Connect Roblox.',
    visual: null,
  },
]

const SECTIONS: Record<string, string[]> = {
  'image-to-map': [
    'Upload a sketch, photo, or concept art (PNG, JPG, WebP — up to 10 MB).',
    'Claude Vision analyses the layout: zones, paths, structures, biomes.',
    'Depth Pro generates a depth map for accurate terrain elevation.',
    'SAM2 segments each region and matches marketplace assets to it.',
    'A fully built Roblox map is placed in your editor 3D preview.',
    'Cost: ~5 tokens per map. Average latency: 12 seconds.',
  ],
  '3d-gen': [
    'Type a description in the 3D Gen panel: "Viking longhouse, weathered wood".',
    'Meshy AI generates a textured mesh in under 30 seconds.',
    'The mesh is scaled to Roblox character proportions (5 studs tall).',
    'Click Insert to place it in your map or download the .obj for Studio.',
    'Cost: ~8 tokens per 3D asset.',
  ],
  marketplace: [
    'Open the Marketplace panel (⌥ M) inside the editor.',
    'Search by keyword, category, or asset ID.',
    '500K+ verified assets from the Roblox Creator Marketplace.',
    'Preview in 3D, then click Insert to place directly.',
    'Free to browse. No extra tokens consumed.',
  ],
}

export default function GetStartedClient() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Breadcrumb */}
      <div className="border-b border-white/5 px-6 py-3 text-xs text-white/30">
        <Link href="/docs" className="hover:text-[#D4AF37]">Docs</Link>
        <span className="mx-2">/</span>
        <span className="text-white/60">Getting Started</span>
      </div>

      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-16 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          Getting Started
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Ship your first AI-built game
        </h1>
        <p className="mx-auto max-w-md text-base text-white/45">
          Six steps. Under 10 minutes. No prior game development experience required.
        </p>

        {/* Progress dots */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === activeStep
                  ? 'w-6 bg-[#D4AF37]'
                  : i < activeStep
                  ? 'w-2 bg-[#D4AF37]/40'
                  : 'w-2 bg-white/10'
              }`}
            />
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Step navigation sidebar + content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden w-48 shrink-0 md:block">
            <div className="sticky top-24 flex flex-col gap-1">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(i)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
                    i === activeStep
                      ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'text-white/35 hover:text-white/70'
                  }`}
                >
                  <span className="text-xs font-mono">{s.number}</span>
                  <span>{s.title}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {STEPS.map((step, i) => (
              <div
                key={step.id}
                id={step.anchor}
                className={`${i === activeStep ? 'block' : 'hidden'}`}
              >
                <div className="mb-2 text-xs font-mono text-[#D4AF37]">Step {step.number}</div>
                <h2 className="mb-4 text-2xl font-bold">{step.title}</h2>
                <p className="mb-6 text-base leading-relaxed text-white/55">{step.description}</p>

                {/* Visual art */}
                {step.visual && (
                  <div className="mb-6 rounded-xl border border-white/5 bg-[#141414] p-6">
                    <div className="mb-3 text-xs text-white/25">{step.visual.label}</div>
                    <div className="font-mono text-sm text-white/50 leading-relaxed">
                      {step.visual.lines.map((line, li) => (
                        <div key={li}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Code block */}
                {step.code && (
                  <div className="mb-6 overflow-hidden rounded-xl border border-white/5 bg-[#141414]">
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                      <span className="text-xs text-white/30">{step.code.label}</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-white/30 font-mono">
                        {step.code.lang}
                      </span>
                    </div>
                    <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-white/65 font-mono">
                      {step.code.body}
                    </pre>
                  </div>
                )}

                {/* Note */}
                {step.note && (
                  <div className="mb-6 flex gap-3 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-4">
                    <span className="text-[#D4AF37] shrink-0">ℹ</span>
                    <p className="text-sm text-white/55">{step.note}</p>
                  </div>
                )}

                {/* Nav buttons */}
                <div className="mt-8 flex items-center gap-3">
                  {i > 0 && (
                    <button
                      onClick={() => setActiveStep(i - 1)}
                      className="rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
                    >
                      ← Previous
                    </button>
                  )}
                  {i < STEPS.length - 1 ? (
                    <button
                      onClick={() => setActiveStep(i + 1)}
                      className="rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e5c547]"
                    >
                      Next →
                    </button>
                  ) : (
                    <Link
                      href="/editor"
                      className="rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#e5c547]"
                    >
                      Open the editor →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional sections */}
        <div className="mt-20 space-y-12">
          {(['image-to-map', '3d-gen', 'marketplace'] as const).map((key) => {
            const titles: Record<string, string> = {
              'image-to-map': 'Image to Map',
              '3d-gen': '3D Generation',
              marketplace: 'Marketplace',
            }
            const anchors: Record<string, string> = {
              'image-to-map': 'image-to-map',
              '3d-gen': '3d-gen',
              marketplace: 'marketplace',
            }
            return (
              <div key={key} id={anchors[key]} className="scroll-mt-24">
                <h2 className="mb-5 text-xl font-bold">{titles[key]}</h2>
                <div className="space-y-3">
                  {SECTIONS[key].map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/10 text-xs font-bold text-[#D4AF37]">
                        {idx + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-white/55">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Next steps */}
        <div className="mt-16 rounded-2xl border border-white/5 bg-[#141414] p-8 text-center">
          <h2 className="mb-2 text-xl font-bold">Ready to go deeper?</h2>
          <p className="mb-6 text-sm text-white/45">Explore more of the platform.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/docs/api"
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              API Reference →
            </Link>
            <Link
              href="/docs/studio"
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              Studio Plugin →
            </Link>
            <Link
              href="/blog"
              className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-white/60 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              Blog →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Documentation',
  description:
    'Everything you need to build Roblox games with ForjeGames AI. Guides, API reference, Studio plugin docs, and more.',
  path: '/docs',
  keywords: [
    'ForjeGames docs',
    'Roblox AI documentation',
    'getting started Roblox AI',
    'ForjeGames API reference',
    'Studio plugin docs',
  ],
})

interface DocCard {
  href: string
  icon: string
  title: string
  description: string
  badge?: string
}

const DOC_CARDS: DocCard[] = [
  {
    href: '/docs/getting-started',
    icon: '▶',
    title: 'Getting Started',
    description: 'Create your account, open the editor, and ship your first AI-built Roblox game in under 10 minutes.',
    badge: 'Start here',
  },
  {
    href: '/docs/studio',
    icon: '⬡',
    title: 'Studio Plugin',
    description: 'Install the ForjeGames plugin for Roblox Studio. Sync AI output directly into your place file.',
  },
  {
    href: '/docs/api',
    icon: '⌥',
    title: 'API Reference',
    description: 'Full REST API docs — all endpoints, auth, rate limits, request/response shapes, and code examples.',
  },
  {
    href: '/docs/getting-started#editor',
    icon: '◈',
    title: 'Editor Guide',
    description: 'Master the split-pane editor: chat panel, live 3D preview, script output, and keyboard shortcuts.',
  },
  {
    href: '/docs/getting-started#voice',
    icon: '◎',
    title: 'Voice Commands',
    description: 'Speak your game into existence. Trigger any AI action hands-free with natural language voice input.',
    badge: 'New',
  },
  {
    href: '/docs/getting-started#image-to-map',
    icon: '◻',
    title: 'Image to Map',
    description: 'Upload a sketch or photo. Claude Vision + Depth Pro convert it into a fully built Roblox map.',
    badge: 'New',
  },
  {
    href: '/docs/getting-started#3d-gen',
    icon: '◆',
    title: '3D Generation',
    description: 'Generate custom meshes with Meshy AI. Describe any prop, structure, or character — get a 3D asset.',
  },
  {
    href: '/docs/getting-started#marketplace',
    icon: '◉',
    title: 'Marketplace',
    description: 'Browse and insert 500K+ verified Roblox marketplace assets directly from the ForjeGames editor.',
  },
  {
    href: '/pricing',
    icon: '◇',
    title: 'Billing & Plans',
    description: 'Understand tokens, plan limits, and how to manage your subscription or API usage.',
  },
]

export default function DocsHubPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Hero */}
      <section className="border-b border-white/5 px-6 py-20 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#D4AF37]">
          Documentation
        </p>
        <h1 className="mx-auto mb-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Build faster with ForjeGames
        </h1>
        <p className="mx-auto max-w-xl text-base text-white/50">
          Guides, references, and tutorials for the AI-powered Roblox development platform.
          Start with Getting Started or jump straight to the API reference.
        </p>

        {/* Search bar — visual only */}
        <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-xl border border-white/10 bg-[#141414] px-4 py-3">
          <span className="text-white/30">⌕</span>
          <span className="flex-1 text-sm text-white/25 text-left">Search docs...</span>
          <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">⌘ K</kbd>
        </div>
      </section>

      {/* Card grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#141414] p-6 transition-all duration-200 hover:border-[#D4AF37]/30 hover:bg-[#1a1a1a]"
            >
              {card.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                  {card.badge}
                </span>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-lg text-[#D4AF37]">
                {card.icon}
              </div>
              <div>
                <h2 className="mb-1 text-base font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm leading-relaxed text-white/45">{card.description}</p>
              </div>
              <div className="mt-auto pt-2 text-xs font-medium text-[#D4AF37]/60 group-hover:text-[#D4AF37] transition-colors">
                Read →
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Help strip */}
      <section className="border-t border-white/5 px-6 py-12 text-center">
        <p className="text-sm text-white/35">
          Can&apos;t find what you&apos;re looking for?{' '}
          <a href="mailto:support@forjegames.com" className="text-[#D4AF37] hover:underline">
            Contact support
          </a>{' '}
          or join the{' '}
          <a href="https://discord.gg/forjegames" className="text-[#D4AF37] hover:underline">
            Discord community
          </a>
          .
        </p>
      </section>
    </div>
  )
}

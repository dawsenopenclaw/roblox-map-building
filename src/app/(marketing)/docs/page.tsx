import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Rocket,
  Sparkles,
  PackageOpen,
  Mic,
  Image as ImageIcon,
  ShoppingBag,
  CreditCard,
  Code,
  Wrench,
  Terminal,
} from 'lucide-react'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'

export const metadata: Metadata = createMetadata({
  title: 'Documentation — API Reference, Guides & Studio Plugin Docs',
  description:
    'ForjeGames documentation: getting started guides, full API reference, Roblox Studio plugin setup, voice-to-game tutorials, and image-to-map walkthroughs. Build your first AI Roblox game in under 10 minutes.',
  path: '/docs',
  keywords: [
    'ForjeGames documentation',
    'Roblox AI builder docs',
    'AI Roblox game builder guide',
    'ForjeGames API reference',
    'Roblox Studio AI plugin setup',
    'voice to game tutorial',
    'image to map Roblox tutorial',
    'ForjeGames getting started',
  ],
})

interface FeatureCard {
  href: string
  icon: typeof Rocket
  title: string
  description: string
  badge?: string
}

const FEATURED: FeatureCard[] = [
  {
    href: '/docs/getting-started',
    icon: Rocket,
    title: 'Getting Started',
    description:
      'Create an account, open the editor, and ship your first AI-built Roblox game in five minutes.',
    badge: 'Start here',
  },
  {
    href: '/docs/ai-modes',
    icon: Sparkles,
    title: 'AI Modes',
    description:
      'Nine specialised modes — Build, Think, Plan, Image, Script, Terrain, 3D, Debug, Ideas — each tuned for a different stage of development.',
  },
  {
    href: '/docs/studio-plugin',
    icon: PackageOpen,
    title: 'Studio Plugin',
    description:
      'Install the ForjeGames plugin for Roblox Studio and push AI output straight into your place file.',
  },
  {
    href: '/docs/voice-input',
    icon: Mic,
    title: 'Voice Input',
    description: 'Hold the mic, describe the change, watch the editor build it. Hands-free development.',
    badge: 'New',
  },
  {
    href: '/docs/image-to-map',
    icon: ImageIcon,
    title: 'Image to Map',
    description:
      'Upload a sketch or screenshot — Claude Vision and Depth Pro turn it into a playable 3D map.',
    badge: 'New',
  },
  {
    href: '/docs/mcp',
    icon: Terminal,
    title: 'MCP Integration',
    description:
      'Connect ForjeGames to Claude Code, Cursor, Windsurf, or any MCP client and build Roblox games without leaving your editor.',
    badge: 'New',
  },
  {
    href: '/docs/marketplace',
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy remixable templates from other creators, or publish your own and earn credits on every sale.',
  },
  {
    href: '/docs/pricing-credits',
    icon: CreditCard,
    title: 'Pricing & Credits',
    description: 'Understand how credits are consumed, which models cost what, and how plans refill each month.',
  },
  {
    href: '/docs/api',
    icon: Code,
    title: 'REST API',
    description: 'Full HTTP reference: auth, generate endpoints, streaming, rate limits, and code samples.',
  },
  {
    href: '/docs/sdk',
    icon: Code,
    title: 'TypeScript & Python SDKs',
    description: 'Typed client libraries with streaming helpers so you can embed ForjeGames in your own tools.',
  },
  {
    href: '/docs/troubleshooting',
    icon: Wrench,
    title: 'Troubleshooting',
    description: 'Fixes for the most common issues: plugin connection errors, failing voice input, stuck generations.',
  },
]

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'ForjeGames Documentation',
  description:
    'Everything you need to build Roblox games with ForjeGames AI. Guides, API reference, Studio plugin docs, and more.',
  url: 'https://forjegames.com/docs',
  datePublished: '2026-03-29',
  dateModified: '2026-04-09',
  author: { '@type': 'Organization', name: 'ForjeGames LLC', url: 'https://forjegames.com' },
  publisher: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    logo: { '@type': 'ImageObject', url: 'https://forjegames.com/logo.png' },
  },
  inLanguage: 'en-US',
  isPartOf: { '@type': 'WebSite', name: 'ForjeGames', url: 'https://forjegames.com' },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://forjegames.com' },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: 'https://forjegames.com/docs' },
  ],
}

export default function DocsHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DocsLayout
        eyebrow="Documentation"
        title="Build faster with ForjeGames"
        description="Guides, references, and tutorials for the AI-powered Roblox development platform. Start with Getting Started or jump straight to the API reference."
        hideToc
      >
        <p>
          ForjeGames is the fastest way to build a Roblox game. You describe the game in
          natural language — or a sketch, or a voice memo — and our AI pipeline generates
          the map, assets, scripts, and UI. This documentation covers everything from a
          five-minute quickstart to the full REST API.
        </p>

        <h2 id="featured">Featured guides</h2>
        <div className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
          {FEATURED.map((card) => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group relative flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-200 hover:border-[#D4AF37]/30 hover:bg-white/[0.04]"
              >
                {card.badge && (
                  <span className="absolute right-4 top-4 rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#D4AF37]">
                    {card.badge}
                  </span>
                )}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                  <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="mb-1 text-[15px] font-semibold text-white group-hover:text-[#D4AF37]">
                    {card.title}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white/50">
                    {card.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        <h2 id="need-help">Need help?</h2>
        <p>
          Can&apos;t find what you&apos;re looking for? Email{' '}
          <a href="mailto:support@forjegames.com">support@forjegames.com</a> or join the{' '}
          <a href="https://discord.gg/forjegames">Discord community</a>. We read every
          message.
        </p>
      </DocsLayout>
    </>
  )
}

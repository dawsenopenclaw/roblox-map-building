import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/clerk'
import { TierBadge } from '@/components/TierBadge'
import { PurchaseButton } from './PurchaseButton'
import { ReviewForm } from './ReviewForm'
import { captureServerEvent } from '@/lib/analytics'
import { ShareButtons } from '@/components/ShareButtons'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://robloxforge.gg'

// ─── Shared demo shape ────────────────────────────────────────────────────────

type DemoTemplate = {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  priceCents: number
  rbxmFileUrl: string | null
  thumbnailUrl: string | null
  averageRating: number
  reviewCount: number
  tags: string[]
  screenshots: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>
  creator: {
    id: string
    displayName: string | null
    username: string | null
    avatarUrl: string | null
    userXp: { tier: string; totalXp: number }
  }
  reviews: Array<{
    id: string
    rating: number
    body: string | null
    creatorResponse: string | null
    createdAt: Date
    reviewer: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null }
  }>
  _count: { purchases: number }
  creatorId: string
}

// Demo templates — one per demo-* id used in the marketplace listing
const DEMO_TEMPLATES: Record<string, DemoTemplate> = {
  'demo-1': {
    id: 'demo-1',
    title: 'Medieval Castle Pack',
    slug: 'medieval-castle-pack',
    description:
      'A fully featured medieval castle game template for Roblox. Includes dungeon systems, NPC enemies, loot tables, and a complete quest framework.\n\nWhat\'s included:\n- Fully scripted castle environment\n- Enemy AI with patrol routes\n- Inventory and loot system\n- Quest tracker UI\n- Mobile-optimized controls',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 1499,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 42,
    tags: ['medieval', 'rpg', 'castle', 'adventure'],
    screenshots: [],
    creator: { id: 'c1', displayName: 'Alex_Builds', username: 'alex_builds', avatarUrl: null, userXp: { tier: 'GOLD', totalXp: 5000 } },
    reviews: [],
    _count: { purchases: 1820 },
    creatorId: 'c1',
  },
  'demo-2': {
    id: 'demo-2',
    title: 'City Starter Kit',
    slug: 'city-starter-kit',
    description:
      'A free, open-source city map starter for Roblox developers. Includes road networks, building shells, street lighting, and terrain.\n\nWhat\'s included:\n- 40+ modular city blocks\n- Pre-built road system\n- Day/night lighting setup\n- Optimized for mobile',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 0,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 5,
    reviewCount: 128,
    tags: ['city', 'map', 'free', 'urban'],
    screenshots: [],
    creator: { id: 'c2', displayName: 'Marcus', username: 'marcus_dev', avatarUrl: null, userXp: { tier: 'PLATINUM', totalXp: 12000 } },
    reviews: [],
    _count: { purchases: 9340 },
    creatorId: 'c2',
  },
  'demo-3': {
    id: 'demo-3',
    title: 'Tycoon Framework',
    slug: 'tycoon-framework',
    description:
      'A production-ready tycoon game framework. Drop-in support for conveyor belts, droppers, upgraders, and a prestige system.\n\nWhat\'s included:\n- Dropper & conveyor system\n- Upgrade tree UI\n- Prestige mechanic\n- ProfileStore integration\n- Mobile-first layout',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 2499,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4,
    reviewCount: 67,
    tags: ['tycoon', 'simulator', 'economy'],
    screenshots: [],
    creator: { id: 'c3', displayName: 'Sarah', username: 'sarah_scripts', avatarUrl: null, userXp: { tier: 'GOLD', totalXp: 7200 } },
    reviews: [],
    _count: { purchases: 3210 },
    creatorId: 'c3',
  },
  'demo-4': {
    id: 'demo-4',
    title: 'Modern UI Kit',
    slug: 'modern-ui-kit',
    description:
      'A clean, modern UI component library for Roblox. Includes 30+ reusable ScreenGui components with consistent theming.\n\nWhat\'s included:\n- Buttons, modals, tooltips\n- Inventory grid\n- Leaderboard panel\n- Settings screen\n- Fully documented',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 999,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 89,
    tags: ['ui', 'gui', 'components', 'modern'],
    screenshots: [],
    creator: { id: 'c4', displayName: 'DesignPro', username: 'designpro', avatarUrl: null, userXp: { tier: 'SILVER', totalXp: 3100 } },
    reviews: [],
    _count: { purchases: 5670 },
    creatorId: 'c4',
  },
  'demo-5': {
    id: 'demo-5',
    title: 'Combat System v2',
    slug: 'combat-system-v2',
    description:
      'A complete combat system for action games. Includes hitbox detection, combo chains, blocking, dodge rolls, and skill cooldowns.\n\nWhat\'s included:\n- Melee & ranged combat\n- Combo input detection\n- Hitbox visualizer (dev mode)\n- Ragdoll on death\n- Fully networked via RemoteEvents',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 1999,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 5,
    reviewCount: 201,
    tags: ['combat', 'pvp', 'hitbox', 'action'],
    screenshots: [],
    creator: { id: 'c5', displayName: 'LuauLegend', username: 'luau_legend', avatarUrl: null, userXp: { tier: 'PLATINUM', totalXp: 18000 } },
    reviews: [],
    _count: { purchases: 7800 },
    creatorId: 'c5',
  },
  'demo-6': {
    id: 'demo-6',
    title: 'Fantasy Map Bundle',
    slug: 'fantasy-map-bundle',
    description:
      'A hand-crafted fantasy world map bundle with forests, mountains, rivers, and ruins. Ready to use as a game world or adventure map.\n\nWhat\'s included:\n- 5 biome zones\n- Dungeon entrance props\n- Ambient particle effects\n- Custom terrain painting\n- Optimized for <15k parts',
    category: 'MAP_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 3499,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4,
    reviewCount: 55,
    tags: ['fantasy', 'map', 'world', 'rpg'],
    screenshots: [],
    creator: { id: 'c6', displayName: 'WorldForge', username: 'world_forge', avatarUrl: null, userXp: { tier: 'GOLD', totalXp: 6500 } },
    reviews: [],
    _count: { purchases: 2100 },
    creatorId: 'c6',
  },
  'demo-7': {
    id: 'demo-7',
    title: 'Admin Panel Script',
    slug: 'admin-panel-script',
    description:
      'A free, lightweight admin panel for any Roblox game. Permission-based commands, banning, kick, teleport, and a visual UI.\n\nWhat\'s included:\n- Role-based permissions\n- 20+ built-in commands\n- In-game GUI panel\n- Ban/unban system\n- Audit log',
    category: 'SCRIPT',
    status: 'PUBLISHED',
    priceCents: 0,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 310,
    tags: ['admin', 'moderation', 'free', 'tools'],
    screenshots: [],
    creator: { id: 'c7', displayName: 'DevTools', username: 'dev_tools', avatarUrl: null, userXp: { tier: 'PLATINUM', totalXp: 22000 } },
    reviews: [],
    _count: { purchases: 14200 },
    creatorId: 'c7',
  },
  'demo-8': {
    id: 'demo-8',
    title: 'Inventory UI Pack',
    slug: 'inventory-ui-pack',
    description:
      'A polished inventory UI system with drag-and-drop, item tooltips, equipment slots, and hotbar. Works with any item framework.\n\nWhat\'s included:\n- Drag-and-drop grid inventory\n- Equipment slots UI\n- Item tooltip system\n- Hotbar with keybinds\n- Animated open/close',
    category: 'UI_KIT',
    status: 'PUBLISHED',
    priceCents: 799,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4,
    reviewCount: 44,
    tags: ['inventory', 'ui', 'items', 'gui'],
    screenshots: [],
    creator: { id: 'c8', displayName: 'UIQueen', username: 'ui_queen', avatarUrl: null, userXp: { tier: 'SILVER', totalXp: 2800 } },
    reviews: [],
    _count: { purchases: 1950 },
    creatorId: 'c8',
  },
  'demo-9': {
    id: 'demo-9',
    title: 'Tropical Island Asset Pack',
    slug: 'tropical-island-asset-pack',
    description:
      'A collection of 60+ tropical island assets including palm trees, beach props, water effects, and coral reef decorations.\n\nWhat\'s included:\n- 20 palm tree variants\n- Beach hut & dock props\n- Animated water shader\n- Coral reef models\n- Seagull ambient NPC',
    category: 'ASSET',
    status: 'PUBLISHED',
    priceCents: 1299,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 5,
    reviewCount: 73,
    tags: ['tropical', 'island', 'beach', 'props'],
    screenshots: [],
    creator: { id: 'c9', displayName: 'IslandArtist', username: 'island_artist', avatarUrl: null, userXp: { tier: 'GOLD', totalXp: 8100 } },
    reviews: [],
    _count: { purchases: 4100 },
    creatorId: 'c9',
  },
  'demo-10': {
    id: 'demo-10',
    title: 'Dungeon Crawler Starter',
    slug: 'dungeon-crawler-starter',
    description:
      'A complete dungeon crawler starter with procedural room generation, enemy spawning, loot drops, and a minimap.\n\nWhat\'s included:\n- Procedural dungeon generator\n- Enemy AI with pathfinding\n- Loot table system\n- Minimap UI\n- Boss room logic',
    category: 'GAME_TEMPLATE',
    status: 'PUBLISHED',
    priceCents: 1999,
    rbxmFileUrl: null,
    thumbnailUrl: null,
    averageRating: 4.5,
    reviewCount: 96,
    tags: ['dungeon', 'rpg', 'procedural', 'roguelike'],
    screenshots: [],
    creator: { id: 'c10', displayName: 'DungeonCraft', username: 'dungeon_craft', avatarUrl: null, userXp: { tier: 'GOLD', totalXp: 6900 } },
    reviews: [],
    _count: { purchases: 3580 },
    creatorId: 'c10',
  },
}

// Fallback: first demo used when DB errors on a real id
const FALLBACK_DEMO = DEMO_TEMPLATES['demo-1']

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // Demo template metadata
  if (id.startsWith('demo-')) {
    const demo = DEMO_TEMPLATES[id] ?? FALLBACK_DEMO
    return {
      title: `${demo.title} - RobloxForge Marketplace`,
      description: demo.description.slice(0, 160),
    }
  }

  try {
    const template = await db.template.findUnique({
      where: { id },
      select: { title: true, description: true },
    })

    if (!template) return {}

    const ogUrl = new URL(`${APP_URL}/api/og`)
    ogUrl.searchParams.set('type', 'template')
    ogUrl.searchParams.set('name', template.title)
    const description = template.description?.slice(0, 160) ?? ''

    return {
      title: `${template.title} - RobloxForge Marketplace`,
      description,
      openGraph: {
        title: `${template.title} - RobloxForge Marketplace`,
        description,
        images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${template.title} - RobloxForge Marketplace`,
        description,
        images: [ogUrl.toString()],
      },
    }
  } catch {
    return {}
  }
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-[#FFB81C]' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Serve demo template when id is a demo id
  if (id.startsWith('demo-')) {
    const demo = DEMO_TEMPLATES[id] ?? FALLBACK_DEMO
    return <TemplateDetail template={demo} id={id} user={null} hasPurchased={false} hasReviewed={false} isDemo />
  }

  let template: DemoTemplate | null = null
  let user: Awaited<ReturnType<typeof getAuthUser>> = null
  let hasPurchased = false
  let hasReviewed = false

  try {
    const [dbTemplate, dbUser] = await Promise.all([
      db.template.findUnique({
        where: { id },
        include: {
          screenshots: { orderBy: { sortOrder: 'asc' } },
          creator: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              userXp: { select: { tier: true, totalXp: true } },
            },
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
            },
          },
          _count: { select: { purchases: true } },
        },
      }),
      getAuthUser().catch(() => null),
    ])

    if (!dbTemplate || dbTemplate.status !== 'PUBLISHED') notFound()

    template = dbTemplate as DemoTemplate
    user = dbUser

    // Fire template_viewed analytics (non-blocking)
    if (user) {
      void captureServerEvent(user.clerkId, 'template_viewed', {
        templateId: template.id,
        templateTitle: template.title,
        priceCents: template.priceCents,
      }).catch(() => {})
    }

    // Check purchase/review status
    if (user) {
      try {
        const purchase = await db.templatePurchase.findFirst({
          where: { templateId: id, buyerId: user.id },
          include: { review: true },
        })
        hasPurchased = !!purchase
        hasReviewed = !!purchase?.review
      } catch {
        // Non-critical — user just won't see the review form
      }
    }
  } catch (err) {
    console.error('[marketplace/[id]] DB error:', err)
    // Fall back to demo so page doesn't crash
    return <TemplateDetail template={FALLBACK_DEMO} id={id} user={null} hasPurchased={false} hasReviewed={false} isDemo />
  }

  if (!template) notFound()

  return (
    <TemplateDetail
      template={template}
      id={id}
      user={user}
      hasPurchased={hasPurchased}
      hasReviewed={hasReviewed}
      isDemo={false}
    />
  )
}

// ─── TemplateDetail render component ─────────────────────────────────────────

type TemplateShape = DemoTemplate

function TemplateDetail({
  template,
  id,
  user,
  hasPurchased,
  hasReviewed,
  isDemo,
}: {
  template: TemplateShape
  id: string
  user: { id: string; clerkId: string } | null
  hasPurchased: boolean
  hasReviewed: boolean
  isDemo: boolean
}) {
  const isCreator = user?.id === template.creatorId
  const isFree = template.priceCents === 0

  const categoryLabels: Record<string, string> = {
    GAME_TEMPLATE: 'Game Template',
    MAP_TEMPLATE: 'Map Template',
    UI_KIT: 'UI Kit',
    SCRIPT: 'Script',
    ASSET: 'Asset',
    SOUND: 'Sound',
  }

  return (
    <div className="max-w-6xl mx-auto">
      {isDemo && (
        <div className="mb-4 bg-[#FFB81C]/10 border border-[#FFB81C]/30 rounded-xl px-4 py-3 text-sm text-[#FFB81C]">
          Preview mode — database not yet connected. This is example content.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screenshot gallery */}
          {template.screenshots.length > 0 ? (
            <div className="space-y-3">
              <div className="aspect-video bg-[#111640] rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={template.screenshots[0].url}
                  alt={template.screenshots[0].altText || template.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {template.screenshots.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {template.screenshots.map((s) => (
                    <div key={s.id} className="w-24 h-16 flex-shrink-0 bg-[#111640] rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.url} alt={s.altText || ''} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-[#111640] rounded-xl flex items-center justify-center">
              <span className="text-6xl opacity-20">🎮</span>
            </div>
          )}

          {/* Title + meta */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <ShareButtons
                url={`${APP_URL}/marketplace/${id}`}
                text={`Check out "${template.title}" on RobloxForge Marketplace`}
                compact
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full">
                {categoryLabels[template.category] || template.category}
              </span>
              {template.tags.map(tag => (
                <span key={tag} className="text-xs bg-white/5 text-gray-500 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{template.title}</h1>
            <div className="flex items-center gap-4">
              {template.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarDisplay rating={template.averageRating} />
                  <span className="text-sm text-gray-400">
                    {template.averageRating.toFixed(1)} ({template.reviewCount} reviews)
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500">{template._count.purchases.toLocaleString()} downloads</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{template.description}</p>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Reviews</h2>

            {/* Leave a review */}
            {!isDemo && user && hasPurchased && !hasReviewed && !isCreator && (
              <ReviewForm templateId={id} />
            )}

            {template.reviews.length === 0 ? (
              <p className="text-gray-500 text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {template.reviews.map((review) => (
                  <div key={review.id} className="bg-[#0D1231] border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#111640] flex items-center justify-center text-sm">
                          {review.reviewer.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.reviewer.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            '👤'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {review.reviewer.displayName || review.reviewer.username || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StarDisplay rating={review.rating} />
                    </div>
                    {review.body && (
                      <p className="text-sm text-gray-300">{review.body}</p>
                    )}
                    {review.creatorResponse && (
                      <div className="mt-3 bg-[#111640] rounded-lg p-3 border-l-2 border-[#FFB81C]/40">
                        <p className="text-xs text-[#FFB81C] font-medium mb-1">Creator response</p>
                        <p className="text-sm text-gray-300">{review.creatorResponse}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Purchase card */}
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5 sticky top-6">
            <p className="text-3xl font-bold text-white mb-1">
              {isFree ? 'Free' : `$${(template.priceCents / 100).toFixed(2)}`}
            </p>
            {!isFree && (
              <p className="text-xs text-gray-500 mb-4">One-time purchase, lifetime access</p>
            )}

            {isDemo ? (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-gray-400">
                Preview only — connect DB to enable purchases
              </div>
            ) : isCreator ? (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-gray-400">
                This is your template
              </div>
            ) : hasPurchased ? (
              <div className="space-y-3">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center text-sm text-green-400">
                  Purchased
                </div>
                {template.rbxmFileUrl && (
                  <a
                    href={template.rbxmFileUrl}
                    download
                    className="block w-full bg-[#FFB81C] hover:bg-[#E6A618] text-black font-semibold py-3 rounded-xl text-sm text-center transition-colors"
                  >
                    Download .rbxm
                  </a>
                )}
              </div>
            ) : (
              <PurchaseButton
                templateId={id}
                priceCents={template.priceCents}
                title={template.title}
                isFree={isFree}
              />
            )}

            {template.rbxmFileUrl && (hasPurchased || isFree) && !isCreator && !isDemo && (
              <p className="text-xs text-gray-500 text-center mt-3">
                Compatible with Roblox Studio
              </p>
            )}
          </div>

          {/* Creator card */}
          <div className="bg-[#0D1231] border border-white/10 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">Creator</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#111640] flex items-center justify-center">
                {template.creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={template.creator.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {template.creator.displayName || template.creator.username || 'Creator'}
                </p>
                {template.creator.userXp && (
                  <TierBadge tier={template.creator.userXp.tier} size="sm" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

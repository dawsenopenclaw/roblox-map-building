import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/clerk'
import { TierBadge } from '@/components/TierBadge'
import { PurchaseButton } from './PurchaseButton'
import { ReviewForm } from './ReviewForm'
import { captureServerEvent } from '@/lib/analytics'
import { ShareButtons } from '@/components/ShareButtons'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://forjegames.com'

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

// ─── Demo reviews (3 per template) ───────────────────────────────────────────

type DemoReview = DemoTemplate['reviews'][0]

const makeReview = (
  id: string,
  reviewer: { id: string; displayName: string; username: string },
  rating: number,
  body: string,
  daysAgo: number,
  creatorResponse?: string,
): DemoReview => ({
  id,
  rating,
  body,
  creatorResponse: creatorResponse ?? null,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000),
  reviewer: { ...reviewer, avatarUrl: null },
})

const DEMO_REVIEWS: Record<string, DemoReview[]> = {
  'demo-1': [
    makeReview('r1a', { id: 'u1', displayName: 'RpgKing99', username: 'rpgking99' }, 5,
      'Incredibly polished — the enemy AI alone would take me weeks to write from scratch. Saved my project.',
      7, 'Thank you! The AI uses a simple state machine — happy to share docs if you need to customize it.'),
    makeReview('r1b', { id: 'u2', displayName: 'MegaDev', username: 'megadev' }, 4,
      'Great starting point. The quest tracker UI needed some tweaks for mobile but the scripting is clean.', 14),
    makeReview('r1c', { id: 'u3', displayName: 'Nova_Studio', username: 'nova_studio' }, 5,
      'Shipped a full game in 3 days using this. The loot table system is surprisingly flexible.', 22),
  ],
  'demo-2': [
    makeReview('r2a', { id: 'u4', displayName: 'CityFan', username: 'cityfan' }, 5,
      'Free and better than paid alternatives I\'ve tried. Road snapping just works.', 3),
    makeReview('r2b', { id: 'u5', displayName: 'TechDev_LX', username: 'techdev_lx' }, 5,
      'The modular blocks make it trivial to expand. Added 20 new block types in an afternoon.', 18),
    makeReview('r2c', { id: 'u6', displayName: 'Pixel_Maps', username: 'pixel_maps' }, 5,
      'Used this as the base for a city sim game, runs at 60fps with 300 players. Optimized well.', 30),
  ],
  'demo-3': [
    makeReview('r3a', { id: 'u7', displayName: 'TycoonFan', username: 'tycoonfan' }, 4,
      'Solid foundation. The ProfileStore integration saved hours. Would love a multi-plot version.', 5),
    makeReview('r3b', { id: 'u8', displayName: 'BloxBuilder', username: 'bloxbuilder' }, 4,
      'Good architecture. The upgrade tree UI is clean and the prestige system is well thought out.', 12),
    makeReview('r3c', { id: 'u9', displayName: 'SimDev', username: 'simdev' }, 4,
      'Works exactly as described. A few edge cases in the conveyor timing but minor issues.', 25),
  ],
  'demo-4': [
    makeReview('r4a', { id: 'u10', displayName: 'UIDesigner', username: 'ui_designer' }, 5,
      'Best UI kit on the platform. Consistent styling, great documentation, easy to theme.', 4),
    makeReview('r4b', { id: 'u11', displayName: 'NewDev101', username: 'newdev101' }, 4,
      'As a beginner the components made my game look professional instantly. Well worth $9.99.', 9),
    makeReview('r4c', { id: 'u12', displayName: 'ProSripts', username: 'proscripts' }, 5,
      'Saved my team 2 weeks. The settings screen alone would have taken days to design from scratch.', 20),
  ],
  'demo-5': [
    makeReview('r5a', { id: 'u13', displayName: 'FightGame', username: 'fightgame' }, 5,
      'Hitbox accuracy is exceptional. Combo chains feel tight. This is the standard for Roblox combat.', 2),
    makeReview('r5b', { id: 'u14', displayName: 'ActionDev', username: 'actiondev' }, 5,
      'Networked perfectly out of the box. Zero desync issues in playtests with 60 players.', 8),
    makeReview('r5c', { id: 'u15', displayName: 'PVP_Master', username: 'pvp_master' }, 5,
      'Replaced my old combat system in a day. Players immediately noticed the improvement.', 16),
  ],
  'demo-6': [
    makeReview('r6a', { id: 'u16', displayName: 'MapArtist', username: 'map_artist' }, 4,
      'Beautiful hand-crafted terrain. The biome transitions are natural looking.', 11),
    makeReview('r6b', { id: 'u17', displayName: 'RPGDev_X', username: 'rpgdev_x' }, 4,
      'Great value for 5 biomes. I added a snow biome on top and it blended seamlessly.', 19),
    makeReview('r6c', { id: 'u18', displayName: 'WorldSmith', username: 'worldsmith' }, 4,
      'Dungeon entrance props are particularly well made. Particle effects are optimized.', 27),
  ],
  'demo-7': [
    makeReview('r7a', { id: 'u19', displayName: 'GameAdmin', username: 'gameadmin' }, 5,
      'Every game I make uses this. The audit log alone justifies it. Free is unbeatable value.', 1),
    makeReview('r7b', { id: 'u20', displayName: 'StudioOwner', username: 'studio_owner' }, 4,
      'The permission system is flexible enough for our 5-person mod team. Solid tool.', 6),
    makeReview('r7c', { id: 'u21', displayName: 'SafetyFirst', username: 'safety_first' }, 5,
      'Ban/unban system works perfectly. The in-game GUI looks professional.', 13),
  ],
  'demo-8': [
    makeReview('r8a', { id: 'u22', displayName: 'ItemSystem', username: 'item_system' }, 4,
      'Drag-and-drop is buttery smooth. The equipment slots cover every RPG archetype I needed.', 10),
    makeReview('r8b', { id: 'u23', displayName: 'RPGCreator', username: 'rpg_creator' }, 4,
      'Well-documented code made customizing the hotbar keybinds trivial.', 17),
    makeReview('r8c', { id: 'u24', displayName: 'MobileFirst', username: 'mobile_first' }, 4,
      'Works great on mobile too — the animated open/close is a nice touch.', 24),
  ],
  'demo-9': [
    makeReview('r9a', { id: 'u25', displayName: 'IslandGame', username: 'island_game' }, 5,
      'Palm tree variants are gorgeous. The animated water shader alone is worth the price.', 3),
    makeReview('r9b', { id: 'u26', displayName: 'BeachVibes', username: 'beach_vibes' }, 5,
      '60+ assets and every single one is high quality. The seagull NPC is a charming detail.', 9),
    makeReview('r9c', { id: 'u27', displayName: 'TropicalDev', username: 'tropical_dev' }, 5,
      'Built a full beach resort game using this. Players love the atmosphere it creates.', 21),
  ],
  'demo-10': [
    makeReview('r10a', { id: 'u28', displayName: 'RogueFan', username: 'rogue_fan' }, 5,
      'Procedural dungeon gen is solid — rooms feel varied and interesting every run.', 4),
    makeReview('r10b', { id: 'u29', displayName: 'DungeonDev', username: 'dungeon_dev' }, 4,
      'Pathfinding enemies are challenging but not unfair. Boss room logic is a great template.', 11),
    makeReview('r10c', { id: 'u30', displayName: 'LoopGames', username: 'loop_games' }, 5,
      'The minimap UI is clean and the loot system is easy to extend with new item types.', 23),
  ],
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

  const metadataBase = new URL(APP_URL)

  // Demo template metadata
  if (id.startsWith('demo-')) {
    const demo = DEMO_TEMPLATES[id] ?? FALLBACK_DEMO
    const ogUrl = new URL(`${APP_URL}/api/og`)
    ogUrl.searchParams.set('type', 'template')
    ogUrl.searchParams.set('name', demo.title)
    ogUrl.searchParams.set('category', demo.category)
    const title = `${demo.title} — ForjeGames Marketplace`
    const description = demo.description.slice(0, 160)
    const canonical = `${APP_URL}/marketplace/${id}`
    return {
      title,
      description,
      metadataBase,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'ForjeGames',
        images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogUrl.toString()],
        creator: '@forjegames',
        site: '@forjegames',
      },
      robots: { index: false, follow: false },
    }
  }

  try {
    const template = await db.template.findUnique({
      where: { id },
      select: { title: true, description: true, slug: true },
    })

    if (!template) return { metadataBase, robots: { index: false, follow: false } }

    const ogUrl = new URL(`${APP_URL}/api/og`)
    ogUrl.searchParams.set('type', 'template')
    ogUrl.searchParams.set('name', template.title)
    const title = `${template.title} — ForjeGames Marketplace`
    const description = template.description?.slice(0, 160) ?? ''
    const canonical = `${APP_URL}/marketplace/${id}`

    return {
      title,
      description,
      metadataBase,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'ForjeGames',
        images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
        type: 'website',
        locale: 'en_US',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogUrl.toString()],
        creator: '@forjegames',
        site: '@forjegames',
      },
      robots: { index: false, follow: false },
    }
  } catch {
    return { metadataBase, robots: { index: false, follow: false } }
  }
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-[#D4AF37]' : 'text-gray-500'}`}
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
    const demoWithReviews: DemoTemplate = {
      ...demo,
      reviews: DEMO_REVIEWS[id] ?? DEMO_REVIEWS['demo-1'] ?? [],
    }
    return <TemplateDetail template={demoWithReviews} id={id} user={null} hasPurchased={false} hasReviewed={false} isDemo />
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

  const PREVIEW_GRADIENTS: Record<string, string> = {
    'demo-1':  'bg-gradient-to-br from-orange-900/70 via-stone-900 to-yellow-900/60',
    'demo-2':  'bg-gradient-to-br from-sky-900/70 via-slate-900 to-blue-900/60',
    'demo-3':  'bg-gradient-to-br from-emerald-900/70 via-teal-900 to-cyan-900/60',
    'demo-4':  'bg-gradient-to-br from-violet-900/70 via-purple-900 to-indigo-900/60',
    'demo-5':  'bg-gradient-to-br from-red-900/70 via-rose-900 to-pink-900/60',
    'demo-6':  'bg-gradient-to-br from-green-900/70 via-emerald-900 to-lime-900/60',
    'demo-7':  'bg-gradient-to-br from-blue-900/70 via-indigo-900 to-violet-900/60',
    'demo-8':  'bg-gradient-to-br from-fuchsia-900/70 via-purple-900 to-pink-900/60',
    'demo-9':  'bg-gradient-to-br from-amber-900/70 via-orange-900 to-yellow-900/60',
    'demo-10': 'bg-gradient-to-br from-slate-900/70 via-gray-900 to-zinc-900/60',
  }

  // SVG icon per category for placeholder preview
  const categoryIconSvg = (cls: string) => {
    const cat = template.category
    if (cat === 'GAME_TEMPLATE') return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
      </svg>
    )
    if (cat === 'MAP_TEMPLATE') return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    )
    if (cat === 'UI_KIT') return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    )
    if (cat === 'SCRIPT') return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    )
    if (cat === 'ASSET') return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    )
    // SOUND + default
    return (
      <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
      </svg>
    )
  }

  // Sibling demos: same category, different id — for "More from creator" / related
  const relatedDemos = Object.values(DEMO_TEMPLATES)
    .filter(t => t.id !== template.id && t.category === template.category)
    .slice(0, 3)

  const moreFromCreator = Object.values(DEMO_TEMPLATES)
    .filter(t => t.id !== template.id && t.creatorId === template.creatorId)
    .slice(0, 3)

  return (
    <div className="max-w-6xl mx-auto">
      {isDemo && (
        <div className="mb-4 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#D4AF37]">
          Preview mode — database not yet connected. This is example content.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Screenshot gallery */}
          {template.screenshots.length > 0 ? (
            <div className="space-y-3">
              <div className="relative aspect-video bg-[#1c1c1c] rounded-xl overflow-hidden">
                <Image
                  src={template.screenshots[0].url}
                  alt={template.screenshots[0].altText || template.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              {template.screenshots.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {template.screenshots.map((s) => (
                    <div key={s.id} className="relative w-24 h-16 flex-shrink-0 bg-[#1c1c1c] rounded-lg overflow-hidden">
                      <Image src={s.url} alt={s.altText || ''} fill unoptimized className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* CSS gradient art preview placeholder */
            <div className={`aspect-video rounded-xl overflow-hidden flex flex-col items-center justify-center gap-3 ${PREVIEW_GRADIENTS[id] ?? 'bg-gradient-to-br from-[#1c1c1c] to-[#141414]'}`}>
              <div className="opacity-25">
                {categoryIconSvg('w-20 h-20 text-white')}
              </div>
              <span className="text-xs text-white/20 uppercase tracking-widest font-semibold">
                {categoryLabels[template.category] ?? template.category}
              </span>
              <div className="flex gap-1.5 mt-1">
                {template.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-white/15 bg-white/5 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Title + meta */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <ShareButtons
                url={`${APP_URL}/marketplace/${id}`}
                text={`Check out "${template.title}" on ForjeGames Marketplace`}
                compact
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-white/5 text-gray-300 px-2.5 py-1 rounded-full">
                {categoryLabels[template.category] || template.category}
              </span>
              {template.tags.map(tag => (
                <span key={tag} className="text-xs bg-white/5 text-gray-400 px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{template.title}</h1>
            <div className="flex items-center gap-4">
              {template.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarDisplay rating={template.averageRating} />
                  <span className="text-sm text-gray-300">
                    {template.averageRating.toFixed(1)} ({template.reviewCount} reviews)
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-400">{template._count.purchases.toLocaleString()} downloads</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#0d0d14] border border-white/10 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{template.description}</p>
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Reviews
                {template.reviews.length > 0 && (
                  <span className="ml-2 text-sm text-white/30 font-normal">({template.reviews.length})</span>
                )}
              </h2>
              {template.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarDisplay rating={template.averageRating} />
                  <span className="text-sm text-white/60 font-semibold">{template.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Leave a review */}
            {!isDemo && user && hasPurchased && !hasReviewed && !isCreator && (
              <ReviewForm templateId={id} />
            )}

            {template.reviews.length === 0 ? (
              <div className="bg-[#0d0d14] border border-white/8 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/8 border border-[#D4AF37]/15 flex items-center justify-center mx-auto mb-3">
                  <StarDisplay rating={0} />
                </div>
                <p className="text-white/60 text-sm font-medium">No reviews yet</p>
                <p className="text-white/25 text-xs mt-1.5 max-w-xs mx-auto">Be the first to purchase and leave a review — your feedback helps the community.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {template.reviews.map((review) => {
                  const name = review.reviewer.displayName || review.reviewer.username || 'Anonymous'
                  const initial = name[0]?.toUpperCase() ?? '?'
                  return (
                    <div key={review.id} className="bg-[#0d0d14] border border-white/8 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                            {review.reviewer.avatarUrl ? (
                              <Image src={review.reviewer.avatarUrl} alt="" width={32} height={32} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-[#D4AF37] text-xs font-bold">{initial}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-none">{name}</p>
                            <p className="text-xs text-white/30 mt-0.5">
                              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <StarDisplay rating={review.rating} />
                      </div>
                      {review.body && (
                        <p className="text-sm text-white/65 leading-relaxed">{review.body}</p>
                      )}
                      {review.creatorResponse && (
                        <div className="mt-3 bg-[#0a0a0a] rounded-lg p-3.5 border-l-2 border-[#D4AF37]/40">
                          <p className="text-xs text-[#D4AF37] font-semibold mb-1.5">Creator response</p>
                          <p className="text-sm text-white/55 leading-relaxed">{review.creatorResponse}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* More from this creator */}
          {moreFromCreator.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  More from {template.creator.displayName ?? template.creator.username ?? 'this creator'}
                </h2>
                <Link href="/marketplace" className="text-xs text-[#D4AF37] hover:text-[#c49b2f] transition-colors">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {moreFromCreator.map(t => (
                  <MiniTemplateCard key={t.id} template={t} />
                ))}
              </div>
            </div>
          )}

          {/* Related templates */}
          {relatedDemos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Related Templates</h2>
                <Link href="/marketplace" className="text-xs text-[#D4AF37] hover:text-[#c49b2f] transition-colors">
                  Browse all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedDemos.map(t => (
                  <MiniTemplateCard key={t.id} template={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Purchase card */}
          <div className="bg-[#0d0d14] border border-[#D4AF37]/20 rounded-2xl p-6 sticky top-6 shadow-[0_0_40px_rgba(212,175,55,0.05)]">
            {/* Price display */}
            <div className="mb-5">
              {isFree ? (
                <p className="text-4xl font-black text-emerald-400 leading-none">Free</p>
              ) : (
                <>
                  <p className="text-4xl font-black text-white leading-none">
                    ${(template.priceCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-white/30 mt-1.5">One-time · lifetime access</p>
                </>
              )}
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/8">
              <div className="text-center flex-1">
                <p className="text-white font-bold text-lg tabular-nums">
                  {template._count.purchases.toLocaleString()}
                </p>
                <p className="text-white/30 text-[10px] uppercase tracking-wide mt-0.5">Downloads</p>
              </div>
              <div className="w-px h-8 bg-white/8" />
              <div className="text-center flex-1">
                <p className="text-white font-bold text-lg tabular-nums">{template.averageRating > 0 ? template.averageRating.toFixed(1) : '—'}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-wide mt-0.5">Rating</p>
              </div>
              <div className="w-px h-8 bg-white/8" />
              <div className="text-center flex-1">
                <p className="text-white font-bold text-lg tabular-nums">{template.reviewCount}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-wide mt-0.5">Reviews</p>
              </div>
            </div>

            {/* CTA area */}
            {isDemo ? (
              <div className="space-y-3">
                <div className="w-full bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] text-black font-bold py-3.5 rounded-xl text-sm text-center cursor-not-allowed opacity-70">
                  Use Template — {isFree ? 'Free' : `$${(template.priceCents / 100).toFixed(2)}`}
                </div>
                <p className="text-xs text-white/25 text-center">Sign in to purchase</p>
              </div>
            ) : isCreator ? (
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center text-sm text-white/50">
                This is your template
              </div>
            ) : hasPurchased ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center text-sm text-emerald-400 font-semibold">
                  Purchased — you own this
                </div>
                {template.rbxmFileUrl && (
                  <a
                    href={template.rbxmFileUrl}
                    download
                    className="block w-full bg-gradient-to-r from-[#D4AF37] to-[#c49b2f] hover:from-[#c49b2f] hover:to-[#b38a28] text-black font-bold py-3.5 rounded-xl text-sm text-center transition-all duration-200"
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

            {/* Compatibility note */}
            <p className="text-xs text-white/20 text-center mt-4">
              Compatible with Roblox Studio · Instant download
            </p>
          </div>

          {/* Creator card */}
          <div className="bg-[#0d0d14] border border-white/8 rounded-2xl p-5">
            <h3 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-4">Created by</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                {template.creator.avatarUrl ? (
                  <Image src={template.creator.avatarUrl} alt="" width={44} height={44} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[#D4AF37] font-bold text-base">
                    {(template.creator.displayName ?? template.creator.username ?? 'C')[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {template.creator.displayName || template.creator.username || 'Creator'}
                </p>
                {template.creator.username && (
                  <p className="text-white/30 text-xs">@{template.creator.username}</p>
                )}
                {template.creator.userXp && (
                  <div className="mt-1">
                    <TierBadge tier={template.creator.userXp.tier} size="sm" />
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/marketplace"
              className="block w-full text-center text-xs text-[#D4AF37] hover:text-[#c49b2f] border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 py-2 rounded-xl transition-all duration-150"
            >
              View all templates by this creator
            </Link>
          </div>

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="bg-[#0d0d14] border border-white/8 rounded-2xl p-5">
              <h3 className="text-xs text-white/30 uppercase tracking-widest font-semibold mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map(tag => (
                  <span key={tag} className="text-xs text-white/40 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── MiniTemplateCard ─────────────────────────────────────────────────────────

const MINI_GRADIENTS: Record<string, string> = {
  'demo-1':  'from-orange-900/50 to-yellow-900/40',
  'demo-2':  'from-sky-900/50 to-blue-900/40',
  'demo-3':  'from-emerald-900/50 to-cyan-900/40',
  'demo-4':  'from-violet-900/50 to-indigo-900/40',
  'demo-5':  'from-red-900/50 to-pink-900/40',
  'demo-6':  'from-green-900/50 to-lime-900/40',
  'demo-7':  'from-blue-900/50 to-violet-900/40',
  'demo-8':  'from-fuchsia-900/50 to-pink-900/40',
  'demo-9':  'from-amber-900/50 to-yellow-900/40',
  'demo-10': 'from-slate-900/50 to-zinc-900/40',
}
// Category icon for mini card
function MiniCategoryIcon({ category }: { category: string }) {
  const cls = 'w-7 h-7 text-white'
  if (category === 'GAME_TEMPLATE') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
    </svg>
  )
  if (category === 'MAP_TEMPLATE') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  )
  if (category === 'SCRIPT') return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  )
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

function MiniTemplateCard({ template }: { template: DemoTemplate }) {
  const isFree = template.priceCents === 0
  const grad = MINI_GRADIENTS[template.id] ?? 'from-gray-900/50 to-zinc-900/40'
  return (
    <Link
      href={`/marketplace/${template.id}`}
      className="group block bg-[#0d0d14] border border-white/8 rounded-xl overflow-hidden hover:border-[#D4AF37]/25 hover:shadow-[0_0_20px_rgba(212,175,55,0.06)] transition-all duration-200"
    >
      <div className={`aspect-video bg-gradient-to-br ${grad} flex items-center justify-center`}>
        <div className="opacity-40 group-hover:opacity-60 transition-opacity">
          <MiniCategoryIcon category={template.category} />
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-white/80 line-clamp-1 group-hover:text-white transition-colors">{template.title}</p>
        <p className="text-xs text-white/30 mt-0.5">
          {isFree ? <span className="text-emerald-400">Free</span> : `$${(template.priceCents / 100).toFixed(2)}`}
        </p>
      </div>
    </Link>
  )
}

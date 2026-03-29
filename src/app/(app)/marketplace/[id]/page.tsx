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

// Demo template shown when the database is unavailable
const DEMO_TEMPLATE = {
  id: 'demo-1',
  title: 'Medieval Castle Game Template',
  slug: 'medieval-castle-game-template',
  description:
    'A fully featured medieval castle game template for Roblox. Includes dungeon systems, NPC enemies, loot tables, and a complete quest framework. Perfect for RPG games targeting the 8-16 age group.\n\nWhat\'s included:\n- Fully scripted castle environment\n- Enemy AI with patrol routes\n- Inventory and loot system\n- Quest tracker UI\n- Mobile-optimized controls',
  category: 'GAME_TEMPLATE',
  status: 'PUBLISHED',
  priceCents: 999,
  rbxmFileUrl: null as string | null,
  thumbnailUrl: null as string | null,
  averageRating: 4.8,
  reviewCount: 24,
  tags: ['medieval', 'rpg', 'castle', 'adventure'],
  screenshots: [] as Array<{ id: string; url: string; altText: string | null; sortOrder: number }>,
  creator: {
    id: 'demo-creator-1',
    displayName: 'RobloxForge',
    username: 'robloxforge',
    avatarUrl: null as string | null,
    userXp: { tier: 'GOLD' as string, totalXp: 5000 },
  },
  reviews: [] as Array<{
    id: string
    rating: number
    body: string | null
    creatorResponse: string | null
    createdAt: Date
    reviewer: { id: string; displayName: string | null; username: string | null; avatarUrl: string | null }
  }>,
  _count: { purchases: 1420 },
  creatorId: 'demo-creator-1',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  // Demo template metadata
  if (id.startsWith('demo-')) {
    return {
      title: `${DEMO_TEMPLATE.title} - RobloxForge Marketplace`,
      description: DEMO_TEMPLATE.description.slice(0, 160),
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

  // Serve demo template when DB is unavailable or id is a demo id
  if (id.startsWith('demo-')) {
    return <TemplateDetail template={DEMO_TEMPLATE} id={id} user={null} hasPurchased={false} hasReviewed={false} isDemo />
  }

  let template: typeof DEMO_TEMPLATE | null = null
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

    template = dbTemplate as typeof DEMO_TEMPLATE
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
    return <TemplateDetail template={DEMO_TEMPLATE} id={id} user={null} hasPurchased={false} hasReviewed={false} isDemo />
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

type TemplateShape = typeof DEMO_TEMPLATE

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

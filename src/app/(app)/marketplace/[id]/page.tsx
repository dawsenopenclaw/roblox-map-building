import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/clerk'
import { TierBadge } from '@/components/TierBadge'
import { PurchaseButton } from './PurchaseButton'
import { ReviewForm } from './ReviewForm'

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

  const [template, user] = await Promise.all([
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
    getAuthUser(),
  ])

  if (!template || template.status !== 'PUBLISHED') notFound()

  // Check if user purchased this template
  let hasPurchased = false
  let hasReviewed = false
  if (user) {
    const purchase = await db.templatePurchase.findFirst({
      where: { templateId: id, buyerId: user.id },
      include: { review: true },
    })
    hasPurchased = !!purchase
    hasReviewed = !!purchase?.review
  }

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
            {user && hasPurchased && !hasReviewed && !isCreator && (
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

            {isCreator ? (
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

            {template.rbxmFileUrl && (hasPurchased || isFree) && !isCreator && (
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

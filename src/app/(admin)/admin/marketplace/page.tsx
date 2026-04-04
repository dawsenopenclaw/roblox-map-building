'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Package } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingTemplate {
  id: string
  title: string
  description: string
  category: string
  priceCents: number
  thumbnailUrl: string | null
  rbxmFileUrl: string | null
  tags: string[]
  createdAt: string
  creator: {
    id: string
    email: string
    displayName: string | null
    username: string | null
  }
}

interface QueueResponse {
  templates: PendingTemplate[]
  total: number
}

// ─── Demo fallback ─────────────────────────────────────────────────────────

function makeDemoQueue(): PendingTemplate[] {
  const now = Date.now()
  return [
    {
      id: 'd1',
      title: 'Modern City Block',
      description:
        'A fully detailed city block with roads, sidewalks, and storefronts. Ready to drop into any urban map.',
      category: 'MAP_TEMPLATE',
      priceCents: 499,
      thumbnailUrl: null,
      rbxmFileUrl: null,
      tags: ['city', 'urban', 'roads'],
      createdAt: new Date(now - 2 * 3_600_000).toISOString(),
      creator: { id: 'u1', email: 'alice@example.com', displayName: 'Alice Smith', username: 'alice' },
    },
    {
      id: 'd2',
      title: 'Tropical Island Pack',
      description: 'Palm trees, beach terrain, and ocean props. Includes 12 unique assets.',
      category: 'ASSET',
      priceCents: 999,
      thumbnailUrl: null,
      rbxmFileUrl: null,
      tags: ['tropical', 'beach', 'island'],
      createdAt: new Date(now - 5 * 3_600_000).toISOString(),
      creator: { id: 'u2', email: 'bob@example.com', displayName: 'Bob Jones', username: 'bob99' },
    },
    {
      id: 'd3',
      title: 'Medieval Castle Walls',
      description:
        'Stone castle walls with battlements, towers, and a drawbridge. High quality, low poly.',
      category: 'GAME_TEMPLATE',
      priceCents: 0,
      thumbnailUrl: null,
      rbxmFileUrl: null,
      tags: ['medieval', 'castle', 'fantasy'],
      createdAt: new Date(now - 24 * 3_600_000).toISOString(),
      creator: { id: 'u3', email: 'carol@example.com', displayName: 'Carol Dev', username: 'caroldev' },
    },
  ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPrice(cents: number) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toFixed(2)}`
}

function categoryLabel(raw: string) {
  return raw.replace(/_/g, ' ')
}

// ─── Card component ───────────────────────────────────────────────────────────

function SubmissionCard({
  template,
  onAction,
  isActing,
  actingAction,
}: {
  template: PendingTemplate
  onAction: (id: string, action: 'approve' | 'reject', reason?: string) => void
  isActing: boolean
  actingAction: 'approve' | 'reject' | null
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const creatorLabel =
    template.creator.displayName ?? template.creator.username ?? template.creator.email

  return (
    <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden flex flex-col sm:flex-row gap-0 transition-colors hover:border-[#2a2a2a]">
      {/* Thumbnail */}
      <div className="w-full sm:w-40 h-36 sm:h-auto flex-shrink-0 bg-[#0f0f0f] flex items-center justify-center relative overflow-hidden">
        {template.thumbnailUrl ? (
          <Image
            src={template.thumbnailUrl}
            alt={template.title}
            fill
            className="object-cover"
            sizes="160px"
            unoptimized
          />
        ) : (
          <Package className="w-10 h-10 text-[#2a2a2a]" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-5 flex flex-col gap-3 min-w-0">
        {/* Top row: title + badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-base leading-tight truncate">
              {template.title}
            </h3>
            <p className="text-[#B0B0B0] text-sm mt-1 line-clamp-2">{template.description}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className="text-xs px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full whitespace-nowrap">
              {categoryLabel(template.category)}
            </span>
            <span className="text-sm font-semibold text-white">
              {formatPrice(template.priceCents)}
            </span>
          </div>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-[#1c1c1c] text-[#B0B0B0] rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#B0B0B0]">
          <span>
            <span className="text-white">{creatorLabel}</span>
            {' — '}
            {template.creator.email}
          </span>
          <span>{formatDate(template.createdAt)}</span>
          {template.rbxmFileUrl && (
            <a
              href={template.rbxmFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#D4AF37] hover:text-[#E6A519] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              .rbxm file
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          {showRejectInput ? (
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                placeholder="Rejection reason (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onAction(template.id, 'reject', rejectReason || undefined)
                    setShowRejectInput(false)
                    setRejectReason('')
                  }
                  if (e.key === 'Escape') {
                    setShowRejectInput(false)
                    setRejectReason('')
                  }
                }}
                autoFocus
                className="flex-1 min-w-0 px-3 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-red-600 transition-colors"
              />
              <button
                onClick={() => {
                  onAction(template.id, 'reject', rejectReason || undefined)
                  setShowRejectInput(false)
                  setRejectReason('')
                }}
                disabled={isActing}
                className="px-3 py-1.5 bg-red-900/20 border border-red-700/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isActing && actingAction === 'reject' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin inline-block" />
                    Rejecting…
                  </span>
                ) : (
                  'Confirm reject'
                )}
              </button>
              <button
                onClick={() => {
                  setShowRejectInput(false)
                  setRejectReason('')
                }}
                className="px-3 py-1.5 bg-[#1c1c1c] border border-[#2a2a2a] text-[#B0B0B0] rounded-lg text-sm hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onAction(template.id, 'approve')}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/20 border border-green-700/40 text-green-400 rounded-lg text-sm font-medium hover:bg-green-900/40 transition-colors disabled:opacity-50"
              >
                {isActing && actingAction === 'approve' ? (
                  <span className="w-3.5 h-3.5 border border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 border border-red-700/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMarketplacePage() {
  const [data, setData] = useState<QueueResponse | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actingAction, setActingAction] = useState<'approve' | 'reject' | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/templates/queue')
      if (!res.ok) throw new Error(`${res.status}`)
      const json = (await res.json()) as QueueResponse
      setData(json)
      setIsDemo(false)
    } catch {
      const demo = makeDemoQueue()
      setData({ templates: demo, total: demo.length })
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleAction = useCallback(
    async (id: string, action: 'approve' | 'reject', reason?: string) => {
      // Optimistic removal for demo mode
      if (isDemo) {
        setData((prev) =>
          prev
            ? { ...prev, templates: prev.templates.filter((t) => t.id !== id), total: prev.total - 1 }
            : prev
        )
        return
      }

      setActingId(id)
      setActingAction(action)
      try {
        await fetch(`/api/admin/templates/${id}/${action}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        // Optimistic removal — no need to refetch
        setData((prev) =>
          prev
            ? { ...prev, templates: prev.templates.filter((t) => t.id !== id), total: prev.total - 1 }
            : prev
        )
      } finally {
        setActingId(null)
        setActingAction(null)
      }
    },
    [isDemo]
  )

  return (
    <div className="space-y-6 p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Marketplace Submissions</h1>
          <p className="text-[#B0B0B0] text-sm mt-1">
            {data != null
              ? `${data.total} pending submission${data.total !== 1 ? 's' : ''}`
              : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#B0B0B0] hover:text-white hover:border-[#D4AF37] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.templates.length ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#141414] border border-[#1c1c1c] rounded-xl">
          <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
          <p className="text-white font-semibold text-lg">No pending submissions</p>
          <p className="text-[#B0B0B0] text-sm mt-1">All marketplace templates have been reviewed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.templates.map((template) => (
            <SubmissionCard
              key={template.id}
              template={template}
              onAction={handleAction}
              isActing={actingId === template.id}
              actingAction={actingId === template.id ? actingAction : null}
            />
          ))}
        </div>
      )}
    </div>
  )
}

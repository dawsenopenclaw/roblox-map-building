'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'

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

const DEMO_QUEUE: PendingTemplate[] = [
  {
    id: 'd1',
    title: 'Modern City Block',
    description: 'A fully detailed city block with roads, sidewalks, and storefronts. Ready to drop into any urban map.',
    category: 'MAP_TEMPLATE',
    priceCents: 499,
    thumbnailUrl: null,
    rbxmFileUrl: null,
    tags: ['city', 'urban', 'roads', 'storefronts'],
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
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
    tags: ['tropical', 'beach', 'island', 'nature'],
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    creator: { id: 'u2', email: 'bob@example.com', displayName: 'Bob Jones', username: 'bob99' },
  },
  {
    id: 'd3',
    title: 'Medieval Castle Walls',
    description: 'Stone castle walls with battlements, towers, and a drawbridge. High quality, low poly.',
    category: 'GAME_TEMPLATE',
    priceCents: 0,
    thumbnailUrl: null,
    rbxmFileUrl: null,
    tags: ['medieval', 'castle', 'fantasy', 'free'],
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    creator: { id: 'u3', email: 'carol@example.com', displayName: 'Carol Dev', username: 'caroldev' },
  },
]

export default function AdminTemplatesPage() {
  const [data, setData] = useState<QueueResponse | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actingAction, setActingAction] = useState<'approve' | 'reject' | 'dmca' | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/templates/queue')
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
      setIsDemo(false)
    } catch {
      setData({ templates: DEMO_QUEUE, total: DEMO_QUEUE.length })
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  const handleAction = async (
    templateId: string,
    action: 'approve' | 'reject' | 'dmca',
    reason?: string
  ) => {
    if (isDemo) {
      // Optimistically remove from demo queue
      setData((prev) =>
        prev ? { ...prev, templates: prev.templates.filter((t) => t.id !== templateId), total: prev.total - 1 } : prev
      )
      return
    }
    setActingId(templateId)
    setActingAction(action)
    try {
      const endpoint =
        action === 'dmca'
          ? `/api/admin/templates/${templateId}/reject`
          : `/api/admin/templates/${templateId}/${action}`
      await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'dmca' ? { reason: 'DMCA_TAKEDOWN' } : { reason }),
      })
      await fetchQueue()
    } finally {
      setActingId(null)
      setActingAction(null)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Template Moderation</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {data
              ? `${data.total} template${data.total !== 1 ? 's' : ''} pending review`
              : '—'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20 rounded-full">
              Demo data
            </span>
          )}
          <button
            onClick={fetchQueue}
            className="flex items-center gap-2 px-3 py-2 bg-[#141414] border border-[#1c1c1c] rounded-lg text-sm text-[#6B7280] hover:text-white hover:border-[#FFB81C] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.templates.length ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#141414] border border-[#1c1c1c] rounded-xl">
          <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
          <p className="text-white font-medium">Queue is empty</p>
          <p className="text-[#6B7280] text-sm mt-1">All templates have been reviewed</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl overflow-hidden">
          <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#1c1c1c]">
                {['Template', 'Creator', 'Category', 'Price', 'Submitted', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c]">
              {data.templates.map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onAction={handleAction}
                  isActing={actingId === template.id}
                  actingAction={actingId === template.id ? actingAction : null}
                />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateRow({
  template,
  onAction,
  isActing,
  actingAction,
}: {
  template: PendingTemplate
  onAction: (id: string, action: 'approve' | 'reject' | 'dmca', reason?: string) => void
  isActing: boolean
  actingAction: 'approve' | 'reject' | 'dmca' | null
}) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  return (
    <tr className="hover:bg-[#1c1c1c] transition-colors">
      <td className="px-4 py-4 max-w-[280px]">
        <p className="text-white text-sm font-medium truncate">{template.title}</p>
        <p className="text-[#6B7280] text-xs mt-0.5 line-clamp-2">{template.description}</p>
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs px-1.5 py-0.5 bg-[#1c1c1c] text-[#6B7280] rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        {template.rbxmFileUrl && (
          <a
            href={template.rbxmFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#FFB81C] hover:text-[#E6A519] mt-1.5"
          >
            <ExternalLink className="w-3 h-3" />
            .rbxm
          </a>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="text-white text-sm">
          {template.creator.displayName || template.creator.username || '—'}
        </p>
        <p className="text-[#6B7280] text-xs">{template.creator.email}</p>
      </td>
      <td className="px-4 py-4">
        <span className="text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] rounded-full">
          {template.category.replace(/_/g, ' ')}
        </span>
      </td>
      <td className="px-4 py-4 text-sm text-white">
        {template.priceCents > 0 ? `$${(template.priceCents / 100).toFixed(2)}` : 'Free'}
      </td>
      <td className="px-4 py-4 text-xs text-[#6B7280]">
        {new Date(template.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-col gap-2">
          {showRejectInput ? (
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Reason (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="flex-1 min-w-0 px-2 py-1 bg-[#1c1c1c] border border-[#1c1c1c] rounded text-xs text-white placeholder:text-[#6B7280] focus:outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  onAction(template.id, 'reject', rejectReason)
                  setShowRejectInput(false)
                }}
                disabled={isActing}
                className="px-2 py-1 bg-red-900/20 border border-red-700/40 text-red-400 rounded text-xs hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowRejectInput(false)}
                className="px-2 py-1 bg-[#1c1c1c] border border-[#1c1c1c] text-[#6B7280] rounded text-xs hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onAction(template.id, 'approve')}
                disabled={isActing}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-900/20 border border-green-700/40 text-green-400 rounded-lg text-xs font-medium hover:bg-green-900/40 transition-colors disabled:opacity-50"
              >
                {isActing && actingAction === 'approve' ? (
                  <div className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={isActing}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900/20 border border-red-700/40 text-red-400 rounded-lg text-xs font-medium hover:bg-red-900/40 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                onClick={() => onAction(template.id, 'dmca')}
                disabled={isActing}
                title="DMCA Takedown"
                className="p-1.5 bg-orange-900/20 border border-orange-700/40 text-orange-400 rounded-lg text-xs hover:bg-orange-900/40 transition-colors disabled:opacity-50"
              >
                {isActing && actingAction === 'dmca' ? (
                  <div className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ExternalLink, Layers } from 'lucide-react'

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

export default function AdminTemplatesPage() {
  const [data, setData] = useState<QueueResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [actingAction, setActingAction] = useState<'approve' | 'reject' | 'dmca' | null>(null)

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/templates/queue')
      if (!res.ok) throw new Error(`${res.status}`)
      setData(await res.json())
    } catch (e) {
      console.error(e)
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
            {data ? `${data.total} template${data.total !== 1 ? 's' : ''} pending review` : '—'}
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="flex items-center gap-2 px-3 py-2 bg-[#0D1231] border border-[#1E2451] rounded-lg text-sm text-[#6B7280] hover:text-white hover:border-[#FFB81C] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#FFB81C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.templates.length ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[#0D1231] border border-[#1E2451] rounded-xl">
          <CheckCircle className="w-10 h-10 text-green-400 mb-3" />
          <p className="text-white font-medium">Queue is empty</p>
          <p className="text-[#6B7280] text-sm mt-1">All templates have been reviewed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {data.templates.map((template) => (
            <TemplateCard
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

function TemplateCard({
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
    <div className="bg-[#0D1231] border border-[#1E2451] rounded-xl overflow-hidden">
      {/* Thumbnail */}
      <div className="h-40 bg-[#111640] relative">
        {template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
            <Layers className="w-10 h-10 opacity-30" />
          </div>
        )}
        <span className="absolute top-2 left-2 text-xs px-2 py-1 bg-[#FFB81C]/10 text-[#FFB81C] rounded-full border border-[#FFB81C]/20">
          {template.category.replace(/_/g, ' ')}
        </span>
        {template.priceCents > 0 && (
          <span className="absolute top-2 right-2 text-xs px-2 py-1 bg-[#0D1231]/80 text-white rounded-full">
            ${(template.priceCents / 100).toFixed(2)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold">{template.title}</h3>
          <p className="text-[#6B7280] text-xs mt-1 line-clamp-2">{template.description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          <span>By</span>
          <span className="text-white">
            {template.creator.displayName || template.creator.username || template.creator.email}
          </span>
          <span>·</span>
          <span>{new Date(template.createdAt).toLocaleDateString()}</span>
        </div>

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-[#111640] text-[#6B7280] rounded-full"
              >
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
            className="flex items-center gap-1.5 text-xs text-[#FFB81C] hover:text-[#E6A519] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Download .rbxm
          </a>
        )}

        {/* Reject reason input */}
        {showRejectInput && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Rejection reason (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#111640] border border-[#1E2451] rounded-lg text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:border-red-500"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAction(template.id, 'approve')}
            disabled={isActing}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-900/20 border border-green-700/40 text-green-400 rounded-lg text-sm font-medium hover:bg-green-900/40 transition-colors disabled:opacity-50"
          >
            {isActing && actingAction === 'approve' ? (
              <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Approve
          </button>

          {showRejectInput ? (
            <button
              onClick={() => {
                onAction(template.id, 'reject', rejectReason)
                setShowRejectInput(false)
              }}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/20 border border-red-700/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40 transition-colors disabled:opacity-50"
            >
              {isActing && actingAction === 'reject' ? (
                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              Confirm Reject
            </button>
          ) : (
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={isActing}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/20 border border-red-700/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-900/40 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          )}

          <button
            onClick={() => onAction(template.id, 'dmca')}
            disabled={isActing}
            title="DMCA Takedown"
            className="px-3 py-2 bg-orange-900/20 border border-orange-700/40 text-orange-400 rounded-lg text-sm hover:bg-orange-900/40 transition-colors disabled:opacity-50"
          >
            {isActing && actingAction === 'dmca' ? (
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Layers({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12l8.25-4.5 8.25 4.5M3.75 16.5l8.25-4.5 8.25 4.5M3.75 7.5l8.25-4.5 8.25 4.5"
      />
    </svg>
  )
}

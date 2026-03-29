'use client'

interface ActivityItem {
  id: string
  action: string
  resource: string
  createdAt: string
  user?: { email: string }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const METHOD_COLORS: Record<string, string> = {
  POST: 'text-green-400',
  PUT: 'text-blue-400',
  PATCH: 'text-blue-400',
  DELETE: 'text-red-400',
  GET: 'text-[#6B7280]',
}

export function ActivityFeedAdmin({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-[#6B7280] text-sm py-4">No recent activity</p>
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {items.map((item) => {
        const method = item.action.split(' ')[0]
        const path = item.action.split(' ').slice(1).join(' ')
        return (
          <div key={item.id} className="flex items-start gap-3 py-2 border-b border-[#1E2451] last:border-0">
            <span
              className={`text-xs font-mono font-bold w-12 flex-shrink-0 ${METHOD_COLORS[method] ?? 'text-[#6B7280]'}`}
            >
              {method}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-mono truncate">{path}</p>
              {item.user && (
                <p className="text-xs text-[#6B7280] truncate">{item.user.email}</p>
              )}
            </div>
            <span className="text-xs text-[#6B7280] flex-shrink-0">{timeAgo(item.createdAt)}</span>
          </div>
        )
      })}
    </div>
  )
}

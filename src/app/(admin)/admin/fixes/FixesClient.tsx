'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bug, Lightbulb, MessageSquare, CheckCircle2, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Star, Tag, User, Filter, Search,
  ArrowUpDown, RefreshCw, Loader2, Save, X,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface FixItem {
  id: string
  type: 'bug' | 'suggestion' | 'feedback'
  title: string
  content: string
  author: string
  severity: string
  priority: string
  qualityRating: number
  actionability: string
  tags: string[]
  timestamp: string
  attachments: number
  channelName: string
  status: string
  progress: number
  staffNotes: string
  assignee: string
  fixCommit: string
}

interface Contributor {
  username: string
  userId: string
  bugsReported: number
  suggestionsSubmitted: number
  qualityScore: number
  criticalFinds: number
  reputation: number
  badges: string[]
}

interface Stats {
  total: number
  bugs: number
  suggestions: number
  fixed: number
  inProgress: number
  avgProgress: number
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30', label: 'CRITICAL' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30', label: 'HIGH' },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30', label: 'MEDIUM' },
  LOW: { color: 'text-zinc-400', bg: 'bg-zinc-500/20 border-zinc-500/30', label: 'LOW' },
  'N/A': { color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30', label: 'SUGGESTION' },
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'text-blue-400' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'text-yellow-400' },
  { value: 'in-progress', label: 'In Progress', color: 'text-orange-400' },
  { value: 'fixed', label: 'Fixed', color: 'text-green-400' },
  { value: 'wontfix', label: "Won't Fix", color: 'text-zinc-500' },
  { value: 'duplicate', label: 'Duplicate', color: 'text-zinc-500' },
]

const TYPE_ICONS = {
  bug: Bug,
  suggestion: Lightbulb,
  feedback: MessageSquare,
}

// ─── Progress Bar ────────────────────────────────────────────────────────────
function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5'
  const color =
    value === 100 ? 'bg-green-500' :
    value >= 60 ? 'bg-yellow-500' :
    value >= 30 ? 'bg-orange-500' :
    value > 0 ? 'bg-red-500' : 'bg-zinc-700'

  return (
    <div className={`w-full ${h} bg-zinc-800 rounded-full overflow-hidden`}>
      <motion.div
        className={`${h} ${color} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}
        />
      ))}
    </span>
  )
}

// ─── Fix Card ────────────────────────────────────────────────────────────────
function FixCard({
  item,
  expanded,
  onToggle,
  onUpdate,
  saving,
}: {
  item: FixItem
  expanded: boolean
  onToggle: () => void
  onUpdate: (id: string, data: Partial<FixItem>) => void
  saving: boolean
}) {
  const sev = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.LOW
  const Icon = TYPE_ICONS[item.type] || MessageSquare
  const statusOption = STATUS_OPTIONS.find((s) => s.value === item.status) || STATUS_OPTIONS[0]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden ${
        item.progress === 100
          ? 'border-green-500/20 bg-green-500/5'
          : item.severity === 'CRITICAL'
          ? 'border-red-500/30 bg-red-500/5'
          : 'border-zinc-800 bg-zinc-900/50'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        {/* Type Icon */}
        <Icon
          size={18}
          className={
            item.type === 'bug' ? 'text-red-400' :
            item.type === 'suggestion' ? 'text-purple-400' : 'text-zinc-400'
          }
        />

        {/* Severity Badge */}
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${sev.bg} ${sev.color}`}>
          {sev.label}
        </span>

        {/* Title */}
        <span className="flex-1 text-sm text-zinc-200 truncate font-medium">
          {item.title || item.content.slice(0, 60)}
        </span>

        {/* Quality Stars */}
        <StarRating rating={item.qualityRating} />

        {/* Progress */}
        <div className="w-24 flex items-center gap-2">
          <ProgressBar value={item.progress} size="sm" />
          <span className="text-xs text-zinc-400 tabular-nums w-8 text-right">{item.progress}%</span>
        </div>

        {/* Status */}
        <span className={`text-xs font-medium ${statusOption.color}`}>
          {statusOption.label}
        </span>

        {/* Expand */}
        {expanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-zinc-800">
              {/* Content */}
              <div className="pt-3">
                <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {item.content}
                </p>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <User size={12} /> {item.author}
                </span>
                <span>#{item.channelName}</span>
                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                {item.attachments > 0 && <span>{item.attachments} attachment{item.attachments > 1 ? 's' : ''}</span>}
                {item.actionability !== 'planned' && (
                  <span className="text-yellow-500">{item.actionability}</span>
                )}
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {/* Status */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Status</label>
                  <select
                    value={item.status}
                    onChange={(e) => onUpdate(item.id, { status: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:border-[#D4AF37] outline-none"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Progress */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Progress: {item.progress}%</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={item.progress}
                    onChange={(e) => onUpdate(item.id, { progress: Number(e.target.value) })}
                    className="w-full accent-[#D4AF37] h-2"
                  />
                </div>

                {/* Assignee */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Assignee</label>
                  <select
                    value={item.assignee}
                    onChange={(e) => onUpdate(item.id, { assignee: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 focus:border-[#D4AF37] outline-none"
                  >
                    <option value="">Unassigned</option>
                    <option value="Vyren">Vyren</option>
                    <option value="Noah">Noah</option>
                    <option value="Coltin">Coltin</option>
                    <option value="ELI (AI)">ELI (AI)</option>
                  </select>
                </div>

                {/* Commit */}
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Fix Commit</label>
                  <input
                    type="text"
                    placeholder="abc1234"
                    value={item.fixCommit}
                    onChange={(e) => onUpdate(item.id, { fixCommit: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>
              </div>

              {/* Staff Notes */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Staff Notes (for Noah&apos;s report)</label>
                <textarea
                  value={item.staffNotes}
                  onChange={(e) => onUpdate(item.id, { staffNotes: e.target.value })}
                  placeholder="Add notes for Noah to compile..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#D4AF37] outline-none resize-none"
                />
              </div>

              {saving && (
                <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
                  <Loader2 size={12} className="animate-spin" /> Saving...
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Client ─────────────────────────────────────────────────────────────
export function FixesClient() {
  const [items, setItems] = useState<FixItem[]>([])
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'bug' | 'suggestion' | 'feedback'>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'severity' | 'progress' | 'date' | 'quality'>('severity')

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/fixes')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setItems(data.items)
      setContributors(data.contributors)
      setStats(data.stats)
    } catch (err) {
      console.error('Failed to load fixes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdate = useCallback(async (id: string, data: Partial<FixItem>) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    )
    setSaving(id)

    try {
      await fetch('/api/admin/fixes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      })
    } catch (err) {
      console.error('Save failed:', err)
      fetchData() // revert on error
    } finally {
      setTimeout(() => setSaving(null), 500)
    }
  }, [fetchData])

  // Filter & sort
  const filtered = items
    .filter((i) => filter === 'all' || i.type === filter)
    .filter((i) => severityFilter === 'all' || i.severity === severityFilter)
    .filter((i) => statusFilter === 'all' || i.status === statusFilter)
    .filter((i) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.author.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'progress') return a.progress - b.progress
      if (sortBy === 'date') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      if (sortBy === 'quality') return b.qualityRating - a.qualityRating
      // default: severity
      const order: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, 'N/A': 4 }
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Bug Fixes Tracker</h1>
          <p className="text-sm text-zinc-500 mt-1">
            All bugs, suggestions, and fixes from Discord — rated and tracked
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData() }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-zinc-100' },
            { label: 'Bugs', value: stats.bugs, color: 'text-red-400' },
            { label: 'Suggestions', value: stats.suggestions, color: 'text-purple-400' },
            { label: 'Fixed', value: stats.fixed, color: 'text-green-400' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-orange-400' },
            { label: 'Avg Progress', value: `${stats.avgProgress}%`, color: 'text-[#D4AF37]' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold tabular-nums ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Overall Progress */}
      {stats && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-300">Overall Fix Progress</span>
            <span className="text-lg font-bold text-[#D4AF37] tabular-nums">{stats.avgProgress}%</span>
          </div>
          <ProgressBar value={stats.avgProgress} size="lg" />
          <div className="flex justify-between mt-2 text-xs text-zinc-500">
            <span>{stats.fixed} of {stats.total} complete</span>
            <span>{stats.total - stats.fixed - stats.inProgress} not started</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search bugs, suggestions, authors, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#D4AF37] outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {(['all', 'bug', 'suggestion', 'feedback'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                filter === t
                  ? 'bg-[#D4AF37] text-black font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t === 'all' ? 'All' : t === 'bug' ? 'Bugs' : t === 'suggestion' ? 'Suggestions' : 'Feedback'}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none"
        >
          <option value="all">All Severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none"
        >
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:border-[#D4AF37] outline-none"
        >
          <option value="severity">Sort: Severity</option>
          <option value="progress">Sort: Progress</option>
          <option value="date">Sort: Newest</option>
          <option value="quality">Sort: Quality</option>
        </select>
      </div>

      {/* Results count */}
      <div className="text-xs text-zinc-500">
        Showing {filtered.length} of {items.length} items
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <FixCard
            key={item.id}
            item={item}
            expanded={expanded === item.id}
            onToggle={() => setExpanded(expanded === item.id ? null : item.id)}
            onUpdate={handleUpdate}
            saving={saving === item.id}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
            <p className="text-sm">
              {items.length === 0 ? 'No items tracked yet' : 'No items match your filters'}
            </p>
          </div>
        )}
      </div>

      {/* Contributors Section */}
      {contributors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-zinc-200 mb-4">Top Contributors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contributors
              .sort((a: Contributor, b: Contributor) => b.reputation - a.reputation)
              .slice(0, 6)
              .map((c, i) => (
                <div key={c.userId} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">
                      {i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{c.username}</div>
                      <div className="text-xs text-zinc-500">{c.reputation} rep</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-zinc-400 mb-2">
                    <span className="inline-flex items-center gap-1"><Bug size={10} /> {c.bugsReported}</span>
                    <span className="inline-flex items-center gap-1"><Lightbulb size={10} /> {c.suggestionsSubmitted}</span>
                    <span className="inline-flex items-center gap-1"><Star size={10} /> {Math.round(c.qualityScore / 20)}/5</span>
                  </div>
                  {c.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.badges.map((badge) => (
                        <span key={badge} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Users, Clock, Plus, ChevronRight, Search } from 'lucide-react'

type LfgPost = {
  id: string
  title: string
  description: string
  gameType: string
  lookingFor: string
  maxMembers: number
  currentMembers: number
  status: string
  createdAt: string
  expiresAt: string
  author: { name: string; avatar: string | null }
}

const GAME_TYPES = ['all', 'tycoon', 'simulator', 'obby', 'rpg', 'horror', 'racing', 'survival', 'other']

const GAME_TYPE_COLORS: Record<string, string> = {
  tycoon: 'bg-green-500/20 text-green-400',
  simulator: 'bg-blue-500/20 text-blue-400',
  obby: 'bg-purple-500/20 text-purple-400',
  rpg: 'bg-red-500/20 text-red-400',
  horror: 'bg-orange-500/20 text-orange-400',
  racing: 'bg-cyan-500/20 text-cyan-400',
  survival: 'bg-amber-500/20 text-amber-400',
  other: 'bg-gray-500/20 text-gray-400',
}

const AVATAR_COLORS = [
  'bg-[#D4AF37]',
  'bg-blue-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-green-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-pink-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function LfgPage() {
  const [posts, setPosts] = useState<LfgPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set())

  const fetchPosts = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('gameType', filter)
      const res = await fetch(`/api/lfg?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to load posts')
        return
      }
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      setError('Failed to connect. Check your internet connection.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    setLoading(true)
    fetchPosts()
  }, [fetchPosts])

  // Client-side search filter
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts
    const q = searchQuery.toLowerCase()
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q)
    )
  }, [posts, searchQuery])

  async function handleJoin(postId: string) {
    setJoiningId(postId)
    try {
      const res = await fetch(`/api/lfg/${postId}/join`, { method: 'POST' })
      if (res.ok) {
        setJoinedIds((prev) => new Set(prev).add(postId))
        await fetchPosts()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to join')
      }
    } catch {
      setError('Failed to join')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgb(15,18,30)' }}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Find a Group</h1>
            <p className="mt-1 text-sm text-gray-400">
              Team up with other builders. Create or join a group to collaborate.
            </p>
          </div>
          <Link
            href="/lfg/create"
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-black transition-colors hover:opacity-90"
            style={{ background: 'rgb(212,175,55)' }}
          >
            <Plus size={16} />
            Create Post
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-4 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, description, or author..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>

        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {GAME_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === type
                  ? 'text-black'
                  : 'text-gray-300 hover:text-white'
              }`}
              style={
                filter === type
                  ? { background: 'rgb(212,175,55)' }
                  : { background: 'rgb(25,28,45)' }
              }
            >
              {type === 'all' ? 'All Types' : type}
            </button>
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
            <button
              onClick={() => setError('')}
              className="ml-3 text-red-300 hover:text-red-200 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/5 p-5"
                style={{ background: 'rgb(25,28,45)' }}
              >
                <div className="h-5 w-3/4 bg-white/[0.06] rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-white/[0.04] rounded animate-pulse mb-2" />
                <div className="h-4 w-2/3 bg-white/[0.04] rounded animate-pulse mb-4" />
                <div className="h-3 w-1/3 bg-white/[0.03] rounded animate-pulse mb-4" />
                <div className="border-t border-white/5 pt-3 flex justify-between">
                  <div className="h-4 w-20 bg-white/[0.04] rounded animate-pulse" />
                  <div className="h-7 w-16 bg-white/[0.06] rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search size={48} className="mb-4 text-gray-600" />
            <p className="text-lg text-gray-400">
              {searchQuery ? 'No posts match your search' : 'No open groups right now'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try a different search term.' : 'Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => {
              const isJoined = joinedIds.has(post.id)
              const avatarColor = getAvatarColor(post.author.name)
              const initial = post.author.name.charAt(0).toUpperCase()

              return (
                <div
                  key={post.id}
                  className="flex flex-col rounded-xl border border-white/5 p-5 transition-colors hover:border-white/10"
                  style={{ background: 'rgb(25,28,45)' }}
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="line-clamp-1 text-base font-semibold text-white">
                      {post.title}
                    </h3>
                    <span
                      className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                        GAME_TYPE_COLORS[post.gameType] ?? GAME_TYPE_COLORS.other
                      }`}
                    >
                      {post.gameType}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-400">
                    {post.description}
                  </p>

                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    <span className="rounded bg-white/5 px-2 py-0.5 text-[11px] text-gray-300">
                      Looking for: {post.lookingFor}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {post.currentMembers}/{post.maxMembers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {timeAgo(post.createdAt)}
                      </span>
                    </div>
                    {isJoined ? (
                      <span className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400">
                        Joined!
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoin(post.id)}
                        disabled={joiningId === post.id || post.status === 'full'}
                        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: 'rgb(212,175,55)' }}
                      >
                        {joiningId === post.id ? 'Joining...' : post.status === 'full' ? 'Full' : 'Join'}
                        {post.status !== 'full' && joiningId !== post.id && <ChevronRight size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Author line with avatar */}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-600">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 ${avatarColor}`}
                    >
                      {initial}
                    </div>
                    by {post.author.name}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

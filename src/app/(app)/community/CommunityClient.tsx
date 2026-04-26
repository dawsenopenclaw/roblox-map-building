'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Send, Users, Hash, Sparkles, HelpCircle, MessageCircle,
  Image, Heart, Reply, ChevronDown, ChevronUp, Plus, Wifi,
} from 'lucide-react'

type FeedPost = {
  id: string
  content: string
  channel: string
  likes: number
  liked: boolean
  replyToId: string | null
  replyCount: number
  createdAt: string
  author: { name: string; avatar: string | null }
  isOwn: boolean
}

const CHANNELS = [
  { id: 'general', label: 'General', icon: Hash, desc: 'Chat about anything' },
  { id: 'looking-for-team', label: 'Find Team', icon: Users, desc: 'Find builders to work with' },
  { id: 'showcase', label: 'Showcase', icon: Sparkles, desc: 'Show off your builds' },
  { id: 'help', label: 'Help', icon: HelpCircle, desc: 'Ask questions, get answers' },
]

const AVATAR_COLORS = [
  'bg-[#D4AF37]', 'bg-blue-500', 'bg-purple-500', 'bg-red-500',
  'bg-green-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500',
]

function getAvatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function CommunityClient() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [onlineCount, setOnlineCount] = useState(0)
  const [replyingTo, setReplyingTo] = useState<FeedPost | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, FeedPost[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed?channel=${channel}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts ?? [])
        setOnlineCount(data.onlineCount ?? 0)
      }
    } catch {
      setError('Failed to load feed')
    } finally {
      setLoading(false)
    }
  }, [channel])

  useEffect(() => {
    setLoading(true)
    setExpandedReplies({})
    fetchPosts()
    const interval = setInterval(fetchPosts, 12000)
    return () => clearInterval(interval)
  }, [fetchPosts])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const content = message.trim()
    if (!content) return

    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          channel,
          replyToId: replyingTo?.id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); return }
      setMessage('')
      setReplyingTo(null)

      if (data.post.replyToId) {
        // Add reply to expanded thread
        setExpandedReplies(prev => ({
          ...prev,
          [data.post.replyToId]: [...(prev[data.post.replyToId] || []), data.post],
        }))
        // Increment reply count on parent
        setPosts(prev => prev.map(p =>
          p.id === data.post.replyToId ? { ...p, replyCount: p.replyCount + 1 } : p
        ))
      } else {
        setPosts(prev => [data.post, ...prev])
        feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Failed to post')
    } finally {
      setSending(false)
    }
  }

  async function handleLike(postId: string) {
    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
    // Also update in expanded replies
    setExpandedReplies(prev => {
      const updated = { ...prev }
      for (const key of Object.keys(updated)) {
        updated[key] = updated[key].map(p =>
          p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
        )
      }
      return updated
    })

    try {
      await fetch(`/api/feed/${postId}/like`, { method: 'POST' })
    } catch { /* revert on error would go here */ }
  }

  async function toggleReplies(postId: string) {
    if (expandedReplies[postId]) {
      setExpandedReplies(prev => { const n = { ...prev }; delete n[postId]; return n })
      return
    }
    setLoadingReplies(postId)
    try {
      const res = await fetch(`/api/feed?parentId=${postId}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setExpandedReplies(prev => ({ ...prev, [postId]: data.posts ?? [] }))
      }
    } catch { /* silent */ }
    setLoadingReplies(null)
  }

  function startReply(post: FeedPost) {
    setReplyingTo(post)
    inputRef.current?.focus()
  }

  // ── Render a single post ─────────────────────────────────────────────────
  function renderPost(post: FeedPost, isReply = false) {
    const avatarColor = getAvatarColor(post.author.name)
    const initial = post.author.name.charAt(0).toUpperCase()
    const hasReplies = post.replyCount > 0
    const isExpanded = !!expandedReplies[post.id]

    return (
      <div key={post.id} className={isReply ? 'ml-10 border-l border-white/5 pl-3' : ''}>
        <div className="flex gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group">
          {/* Avatar */}
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="" className="w-8 h-8 rounded-full shrink-0 object-cover" />
          ) : (
            <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* Author + time */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold text-white">{post.author.name}</span>
              <span className="text-[10px] text-gray-600">{timeAgo(post.createdAt)}</span>
              {post.isOwn && (
                <span className="text-[9px] bg-[#D4AF37]/15 text-[#D4AF37] px-1.5 rounded-full font-medium">you</span>
              )}
            </div>

            {/* Content */}
            <p className="text-[13px] text-gray-300 break-words whitespace-pre-wrap leading-snug mt-0.5">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Like */}
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 text-[11px] transition-colors ${
                  post.liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                }`}
              >
                <Heart size={12} className={post.liked ? 'fill-current' : ''} />
                {post.likes > 0 && post.likes}
              </button>

              {/* Reply */}
              {!isReply && (
                <button
                  onClick={() => startReply(post)}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors"
                >
                  <Reply size={12} />
                  Reply
                </button>
              )}

              {/* Expand replies */}
              {hasReplies && !isReply && (
                <button
                  onClick={() => toggleReplies(post.id)}
                  className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-white transition-colors"
                >
                  {loadingReplies === post.id ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : isExpanded ? (
                    <><ChevronUp size={12} /> Hide {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}</>
                  ) : (
                    <><ChevronDown size={12} /> {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded replies */}
        {isExpanded && expandedReplies[post.id]?.map(reply => renderPost(reply, true))}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex" style={{ background: 'rgb(15,18,30)' }}>
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-white/5 p-3 hidden sm:flex flex-col" style={{ background: 'rgb(12,14,24)' }}>
        {/* Online indicator */}
        <div className="flex items-center gap-1.5 px-2.5 mb-4">
          <Wifi size={12} className="text-green-400" />
          <span className="text-[11px] text-green-400 font-medium">{onlineCount} online</span>
        </div>

        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2 px-2">Channels</h2>
        <div className="space-y-0.5">
          {CHANNELS.map(ch => {
            const Icon = ch.icon
            const isActive = channel === ch.id
            return (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
                  isActive
                    ? 'bg-[#D4AF37]/12 text-[#D4AF37] font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="truncate">{ch.label}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto pt-3 border-t border-white/5 space-y-0.5">
          <Link href="/lfg" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Users size={15} />
            Find Groups
          </Link>
          <Link href="/team" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <MessageCircle size={15} />
            My Teams
          </Link>
          <Link href="/editor" className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <Image size={15} />
            Editor
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-white/5 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Hash size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-white">
              {CHANNELS.find(c => c.id === channel)?.label || 'General'}
            </span>
            <span className="text-[11px] text-gray-600 hidden sm:inline">
              {CHANNELS.find(c => c.id === channel)?.desc}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* LFG prompt in find-team channel */}
            {channel === 'looking-for-team' && (
              <Link
                href="/lfg/create"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
              >
                <Plus size={12} />
                Create LFG Post
              </Link>
            )}
            {/* Mobile channel switcher */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <Wifi size={10} className="text-green-400" />
              <span className="text-[10px] text-green-400">{onlineCount}</span>
            </div>
            <select
              value={channel}
              onChange={e => setChannel(e.target.value)}
              className="sm:hidden bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white"
            >
              {CHANNELS.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.label}</option>
              ))}
            </select>
          </div>
        </header>

        {/* Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
          {loading ? (
            <div className="space-y-3 pt-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-20 bg-white/[0.06] rounded" />
                    <div className="h-3.5 w-3/4 bg-white/[0.04] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle size={36} className="mx-auto mb-2 text-gray-700" />
              <p className="text-gray-400 text-sm">No messages in #{CHANNELS.find(c => c.id === channel)?.label.toLowerCase()} yet.</p>
              <p className="text-gray-600 text-xs mt-0.5">Be the first to say something!</p>
            </div>
          ) : (
            posts.map(post => renderPost(post))
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg px-3 py-1.5 flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-200 ml-2">×</button>
          </div>
        )}

        {/* Reply indicator */}
        {replyingTo && (
          <div className="mx-4 mb-1 bg-[#D4AF37]/5 border border-[#D4AF37]/15 rounded-lg px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-[#D4AF37]">
              Replying to <strong>{replyingTo.author.name}</strong>: {replyingTo.content.slice(0, 60)}{replyingTo.content.length > 60 ? '...' : ''}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white text-xs ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Compose */}
        <form onSubmit={handleSend} className="border-t border-white/5 px-4 py-2.5 shrink-0">
          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={
                replyingTo
                  ? `Reply to ${replyingTo.author.name}...`
                  : `Message #${(CHANNELS.find(c => c.id === channel)?.label || 'general').toLowerCase()}...`
              }
              maxLength={500}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="p-2 rounded-lg transition-all disabled:opacity-20"
              style={{ background: message.trim() ? 'rgb(212,175,55)' : 'transparent' }}
            >
              <Send size={16} className={message.trim() ? 'text-black' : 'text-gray-600'} />
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

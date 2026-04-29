'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, GripHorizontal, MessageCircle, Send, Users, Minimize2, Maximize2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommunityMessage {
  id: string
  username: string
  content: string
  timestamp: string
  avatar?: string
}

// ─── Draggable hook ──────────────────────────────────────────────────────────

function useDraggable(initialPos: { x: number; y: number }) {
  const [pos, setPos] = useState(initialPos)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const newX = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - offset.current.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y))
      setPos({ x: newX, y: newY })
    }
    const onMouseUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return { pos, onMouseDown }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CommunityPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [onlineCount] = useState(() => Math.floor(Math.random() * 20) + 5)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { pos, onMouseDown } = useDraggable({
    x: typeof window !== 'undefined' ? window.innerWidth - 400 : 600,
    y: 80,
  })

  // Fetch community messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch('/api/community/messages')
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages ?? [])
        }
      } catch {
        // Fallback — show welcome message
        setMessages([
          {
            id: 'welcome',
            username: 'ForjeBot',
            content: 'Welcome to the ForjeGames community! Share builds, ask questions, and help each other out.',
            timestamp: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    const optimistic: CommunityMessage = {
      id: `local-${Date.now()}`,
      username: 'You',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')

    try {
      await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
    } catch {
      // Message stays in UI optimistically
    }
  }

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div
      className="fixed z-50"
      style={{
        left: pos.x,
        top: pos.y,
        width: 360,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        className="rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(12,16,32,0.95) 0%, rgba(8,10,24,0.95) 100%)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(212,175,55,0.15)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)',
          height: minimized ? 'auto' : 440,
        }}
      >
        {/* Header — draggable */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing select-none"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          onMouseDown={onMouseDown}
        >
          <div className="flex items-center gap-2.5">
            <GripHorizontal size={14} className="text-gray-600" />
            <MessageCircle size={14} className="text-[#D4AF37]" />
            <span className="text-sm font-semibold text-white">Community</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 mr-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">{onlineCount} online</span>
            </div>
            <button
              onClick={() => setMinimized(m => !m)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
              {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={24} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-gray-500 text-sm">No messages yet</p>
                  <p className="text-gray-600 text-xs mt-1">Be the first to say something!</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="group">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-xs font-bold flex-shrink-0"
                        style={{ color: msg.username === 'ForjeBot' ? '#D4AF37' : msg.username === 'You' ? '#60a5fa' : '#e5e7eb' }}
                      >
                        {msg.username}
                      </span>
                      <span className="text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-300 leading-relaxed mt-0.5">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
                  placeholder="Say something..."
                  maxLength={280}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-30"
                  style={{ color: input.trim() ? '#D4AF37' : undefined }}
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

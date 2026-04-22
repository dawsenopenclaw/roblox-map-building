'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Bot, User, Loader2, Brain, Zap, Bug, Lightbulb, BarChart3,
  ChevronDown, ChevronUp, Trash2, Plus, Star, RefreshCw, Terminal,
  MessageSquare, Shield, TrendingUp, Clock, CheckCircle2, X,
  Sparkles, Database, Activity,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: ActionResult[]
  context?: {
    memoriesUsed: number
    bugsTracked: number
    codeContextLoaded?: boolean
    stats: Record<string, unknown>
  }
}

interface ActionResult {
  type: string
  params: Record<string, unknown>
  result?: string
  success?: boolean
}

interface MemoryEntry {
  id: string
  type: string
  content: string
  source: string
  confidence: number
  timestamp: string
  usageCount: number
  tags: string[]
}

interface MemoryStats {
  totalMemories: number
  conversationCount: number
  avgConfidence: number
  byType: Record<string, number>
  lastUpdated: string
}

// ─── Quick Prompts ───────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: Bug, label: 'Fix Top Bug', prompt: 'Find the highest severity unfixed bug, read the relevant code using codegraph and read_file, then actually fix it with edit_file. Show me the diff when done.' },
  { icon: TrendingUp, label: 'What to Fix Next', prompt: 'Based on bug severity, user impact, and what areas are getting the most reports — what should we fix next and why? Cross-reference with the actual code.' },
  { icon: Terminal, label: 'Git Status', prompt: 'Run git status and git log --oneline -10 to show me what state the repo is in. Any uncommitted changes?' },
  { icon: BarChart3, label: 'Weekly Digest', prompt: 'Generate a full weekly digest for Noah to compile. Include all bugs, suggestions, action items, contributor highlights, and code areas that need attention.' },
  { icon: Shield, label: 'Audit Code', prompt: 'Pick the most critical file in the codebase (like the main chat route or AI provider), read it, and give me a real audit — bugs, performance issues, security concerns. Be brutally honest.' },
  { icon: Sparkles, label: 'Self-Improve', prompt: 'Review your memory graph. What patterns have you learned? What gaps do you have? Search the code for things you should know but dont. Save new insights.' },
  { icon: Lightbulb, label: 'Review Suggestions', prompt: 'Review all user suggestions. For each one, check the actual code to see how hard it would be to implement. Rate effort vs impact.' },
  { icon: Activity, label: 'Full Status Report', prompt: 'Run git status, check all bugs, check contributor stats, and give me a complete status report of where ForjeGames stands right now. Include code health.' },
]

// ─── Message Bubble ──────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-[#D4AF37]" />
        </div>
      )}
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#D4AF37] text-black rounded-br-md'
              : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-bl-md'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Actions taken */}
        {message.actions && message.actions.length > 0 && (
          <div className="space-y-1.5">
            {message.actions.map((action, i) => {
              const isCode = ['read_file', 'edit_file', 'create_file', 'query_code', 'search_symbol', 'find_callers'].includes(action.type)
              const isShell = ['run_command', 'git_status', 'git_diff'].includes(action.type)
              const hasLongResult = (action.result?.length || 0) > 100

              return (
                <div key={i} className="rounded-lg overflow-hidden border border-zinc-700">
                  {/* Action header */}
                  <div
                    className={`flex items-center gap-2 text-xs px-3 py-1.5 ${
                      action.success
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {action.success ? <CheckCircle2 size={12} /> : <X size={12} />}
                    <span className="font-mono font-bold">{action.type}</span>
                    {!hasLongResult && action.result && (
                      <span className="text-zinc-400 truncate">{action.result}</span>
                    )}
                  </div>
                  {/* Expanded result for code/shell actions */}
                  {hasLongResult && action.result && (isCode || isShell) && (
                    <div className="bg-zinc-950 px-3 py-2 max-h-48 overflow-y-auto">
                      <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {action.result}
                      </pre>
                    </div>
                  )}
                  {hasLongResult && action.result && !isCode && !isShell && (
                    <div className="bg-zinc-950 px-3 py-2 max-h-32 overflow-y-auto">
                      <p className="text-xs text-zinc-400 whitespace-pre-wrap">{action.result}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Context info */}
        {message.context && (
          <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
            <span className="inline-flex items-center gap-1"><Brain size={10} /> {message.context.memoriesUsed} memories</span>
            <span className="inline-flex items-center gap-1"><Bug size={10} /> {message.context.bugsTracked} bugs</span>
            {message.context.codeContextLoaded && (
              <span className="inline-flex items-center gap-1 text-[#D4AF37]"><Terminal size={10} /> codegraph active</span>
            )}
          </div>
        )}

        <div className="text-[10px] text-zinc-600">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-zinc-300" />
        </div>
      )}
    </motion.div>
  )
}

// ─── Memory Panel ────────────────────────────────────────────────────────────
function MemoryPanel({
  memories,
  stats,
  onDelete,
  onBoost,
}: {
  memories: MemoryEntry[]
  stats: MemoryStats | null
  onDelete: (id: string) => void
  onBoost: (id: string) => void
}) {
  const typeColors: Record<string, string> = {
    learning: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    pattern: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    decision: 'text-green-400 bg-green-500/10 border-green-500/20',
    'user-pref': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'bug-insight': 'text-red-400 bg-red-500/10 border-red-500/20',
    metric: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
            <div className="text-lg font-bold text-[#D4AF37]">{stats.totalMemories}</div>
            <div className="text-[10px] text-zinc-500">Memories</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
            <div className="text-lg font-bold text-zinc-200">{stats.conversationCount}</div>
            <div className="text-[10px] text-zinc-500">Conversations</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
            <div className="text-lg font-bold text-green-400">{stats.avgConfidence}%</div>
            <div className="text-[10px] text-zinc-500">Avg Confidence</div>
          </div>
          <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
            <div className="text-lg font-bold text-purple-400">
              {Object.keys(stats.byType || {}).length}
            </div>
            <div className="text-[10px] text-zinc-500">Categories</div>
          </div>
        </div>
      )}

      {/* Memory List */}
      <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
        {memories.map((m) => (
          <div key={m.id} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800 group">
            <div className="flex items-start gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColors[m.type] || 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                {m.type}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-300 leading-relaxed">{m.content}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                  <span>{m.confidence}% conf</span>
                  <span>used {m.usageCount}x</span>
                  {m.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-1 rounded bg-zinc-800">{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onBoost(m.id)}
                  className="p-1 rounded hover:bg-green-500/20 text-zinc-500 hover:text-green-400"
                  title="Boost confidence"
                >
                  <Star size={12} />
                </button>
                <button
                  onClick={() => onDelete(m.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
                  title="Delete memory"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main ELI Client ─────────────────────────────────────────────────────────
export function EliClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [insights, setInsights] = useState<{
    summary: Record<string, number>
    suggestions: string[]
    categoryInsights: Array<{ category: string; confidence: string; avgScore: number | null; tips: string[] }>
    recurringFailures: Array<{ content: string; confidence: number }>
  } | null>(null)

  const loadInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/eli/insights')
      if (res.ok) setInsights(await res.json())
    } catch {}
  }, [])
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null)
  const [showQuickPrompts, setShowQuickPrompts] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Load saved conversation
  useEffect(() => {
    try {
      const saved = localStorage.getItem('eli_conversation')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          setShowQuickPrompts(false)
        }
      }
    } catch {}
  }, [])

  // Save conversation
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('eli_conversation', JSON.stringify(messages.slice(-50)))
    }
  }, [messages])

  // Load memories
  const loadMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/eli/memory')
      if (res.ok) {
        const data = await res.json()
        setMemories(data.memories)
        setMemoryStats(data.stats)
      }
    } catch {}
  }, [])

  useEffect(() => { loadMemories() }, [loadMemories])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)
    setShowQuickPrompts(false)

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      // Keep last 20 messages for context
      const contextMessages = allMessages.slice(-20)

      const res = await fetch('/api/admin/eli/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages }),
      })

      if (!res.ok) throw new Error(`API ${res.status}`)

      const data = await res.json()

      const assistantMsg: Message = {
        id: `msg_${Date.now()}_eli`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        actions: data.actions,
        context: data.context,
      }

      setMessages((prev) => [...prev, assistantMsg])

      // Refresh memories if ELI saved any
      if (data.actions?.some((a: ActionResult) => a.type === 'save_memory')) {
        loadMemories()
      }
    } catch (err) {
      const errorMsg: Message = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}. Try again.`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [messages, sending, loadMemories])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setShowQuickPrompts(true)
    localStorage.removeItem('eli_conversation')
  }

  const handleDeleteMemory = async (id: string) => {
    await fetch('/api/admin/eli/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    loadMemories()
  }

  const handleBoostMemory = async (id: string) => {
    await fetch('/api/admin/eli/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'boost', id, delta: 10 }),
    })
    loadMemories()
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 flex items-center justify-center">
              <Bot size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                ELI
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-normal">
                  online
                </span>
              </h1>
              <p className="text-xs text-zinc-500">Engineering & Learning Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMemory(!showMemory)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showMemory
                  ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Brain size={14} /> Memory {memoryStats ? `(${memoryStats.totalMemories})` : ''}
            </button>
            <button
              onClick={() => { setShowInsights(!showInsights); if (!insights) loadInsights() }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                showInsights
                  ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <TrendingUp size={14} /> Insights
            </button>
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome / Quick Prompts */}
          {showQuickPrompts && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto pt-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                  <Bot size={32} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100 mb-1">Hey, I&apos;m ELI</h2>
                <p className="text-sm text-zinc-400">
                  Your AI operations agent. I track bugs, analyze trends, manage the community, and get smarter every time we talk.
                </p>
                {memoryStats && (
                  <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
                    <span className="inline-flex items-center gap-1"><Brain size={12} /> {memoryStats.totalMemories} memories</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {memoryStats.conversationCount} conversations</span>
                    <span className="inline-flex items-center gap-1"><Zap size={12} /> {memoryStats.avgConfidence}% avg confidence</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-left hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-colors group"
                  >
                    <qp.icon size={18} className="text-zinc-500 group-hover:text-[#D4AF37] transition-colors flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100">{qp.label}</div>
                      <div className="text-xs text-zinc-600 line-clamp-1">{qp.prompt}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Chat Messages */}
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-[#D4AF37]" />
              </div>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
          {/* Quick prompt buttons when chatting */}
          {messages.length > 0 && !showQuickPrompts && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.slice(0, 4).map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={sending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-colors whitespace-nowrap flex-shrink-0 disabled:opacity-50"
                >
                  <qp.icon size={10} /> {qp.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ELI anything — bugs, metrics, strategy, actions..."
              rows={1}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#D4AF37] outline-none resize-none max-h-32"
              style={{ minHeight: '44px' }}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="w-11 h-11 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center hover:bg-[#C4A037] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <div className="text-[10px] text-zinc-600 mt-1.5 text-center">
            ELI learns from every conversation. Press Enter to send, Shift+Enter for new line.
          </div>
        </div>
      </div>

      {/* Memory Sidebar */}
      <AnimatePresence>
        {showMemory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-zinc-800 bg-zinc-950 overflow-hidden flex-shrink-0"
          >
            <div className="w-[360px] h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Brain size={16} className="text-[#D4AF37]" /> ELI&apos;s Memory
                </h2>
                <div className="flex gap-1">
                  <button
                    onClick={loadMemories}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                  >
                    <RefreshCw size={14} />
                  </button>
                  <button
                    onClick={() => setShowMemory(false)}
                    className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <MemoryPanel
                  memories={memories}
                  stats={memoryStats}
                  onDelete={handleDeleteMemory}
                  onBoost={handleBoostMemory}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights Sidebar */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-zinc-800 bg-zinc-950 overflow-hidden flex-shrink-0"
          >
            <div className="w-[400px] h-full flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <TrendingUp size={16} className="text-purple-400" /> Build Intelligence
                </h2>
                <button onClick={loadInsights} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {!insights ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-purple-400" size={20} />
                  </div>
                ) : (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
                        <div className="text-lg font-bold text-green-400">{insights.summary.highScoreBuilds ?? 0}</div>
                        <div className="text-[10px] text-zinc-500">High-Score Patterns</div>
                      </div>
                      <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800">
                        <div className="text-lg font-bold text-red-400">{insights.summary.recurringFailures ?? 0}</div>
                        <div className="text-[10px] text-zinc-500">Recurring Failures</div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {insights.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-[#D4AF37] mb-2 flex items-center gap-1.5">
                          <Lightbulb size={12} /> Auto-Suggestions
                        </h3>
                        <div className="space-y-1.5">
                          {insights.suggestions.map((s, i) => (
                            <div key={i} className="text-[11px] text-zinc-400 bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category Insights */}
                    <div>
                      <h3 className="text-xs font-bold text-purple-400 mb-2 flex items-center gap-1.5">
                        <BarChart3 size={12} /> Category Performance
                      </h3>
                      <div className="space-y-1.5">
                        {insights.categoryInsights.map((ci) => (
                          <div key={ci.category} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                            <span className="text-[11px] text-zinc-300 capitalize">{ci.category}</span>
                            <div className="flex items-center gap-2">
                              {ci.avgScore !== null ? (
                                <span className={`text-[11px] font-mono ${ci.avgScore >= 70 ? 'text-green-400' : ci.avgScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {ci.avgScore.toFixed(0)}/100
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-600">No data</span>
                              )}
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                ci.confidence === 'high' ? 'bg-green-500/10 text-green-400' :
                                ci.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {ci.confidence}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recurring Failures */}
                    {insights.recurringFailures.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1.5">
                          <Bug size={12} /> Recurring Failures
                        </h3>
                        <div className="space-y-1.5">
                          {insights.recurringFailures.map((f, i) => (
                            <div key={i} className="text-[11px] text-zinc-400 bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/10">
                              {f.content.slice(0, 150)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

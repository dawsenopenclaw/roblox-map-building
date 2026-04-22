/**
 * ELI Memory System — Persistent learning across conversations
 *
 * Stores learnings, patterns, decisions, and insights that make ELI
 * smarter over time. Backed by a JSON file + optional DB sync.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { EliMemoryEntry } from './brain'

const MEMORY_FILE = join(process.cwd(), 'scripts', '.eli-memory.json')

interface MemoryStore {
  entries: EliMemoryEntry[]
  conversationCount: number
  lastUpdated: string
  version: number
}

function generateId(): string {
  return `eli_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadMemory(): MemoryStore {
  try {
    if (existsSync(MEMORY_FILE)) {
      return JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
    }
  } catch {}
  return {
    entries: getBootstrapMemories(),
    conversationCount: 0,
    lastUpdated: new Date().toISOString(),
    version: 1,
  }
}

export function saveMemory(store: MemoryStore) {
  store.lastUpdated = new Date().toISOString()
  writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2))
}

export function addMemory(
  type: EliMemoryEntry['type'],
  content: string,
  tags: string[],
  confidence: number,
  source: string
): EliMemoryEntry {
  const store = loadMemory()

  // Check for duplicate/similar memories
  const existing = store.entries.find(
    (e) => e.type === type && similarity(e.content, content) > 0.7
  )

  if (existing) {
    // Update existing memory instead of duplicating
    existing.content = content
    existing.confidence = Math.min(100, Math.max(existing.confidence, confidence))
    existing.usageCount++
    existing.timestamp = new Date().toISOString()
    existing.tags = [...new Set([...existing.tags, ...tags])]
    saveMemory(store)
    return existing
  }

  const entry: EliMemoryEntry = {
    id: generateId(),
    type,
    content,
    source,
    confidence,
    timestamp: new Date().toISOString(),
    usageCount: 0,
    tags,
  }

  store.entries.push(entry)

  // Prune low-confidence old memories (keep max 200)
  if (store.entries.length > 200) {
    store.entries.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + a.usageCount * 10 + (a.type === 'learning' ? 5 : 0)
      const scoreB = b.confidence * 0.6 + b.usageCount * 10 + (b.type === 'learning' ? 5 : 0)
      return scoreB - scoreA
    })
    store.entries = store.entries.slice(0, 200)
  }

  saveMemory(store)
  return entry
}

export function getMemories(opts?: {
  type?: EliMemoryEntry['type']
  tags?: string[]
  minConfidence?: number
  limit?: number
}): EliMemoryEntry[] {
  const store = loadMemory()
  let entries = store.entries

  if (opts?.type) {
    entries = entries.filter((e) => e.type === opts.type)
  }
  if (opts?.tags?.length) {
    entries = entries.filter((e) => opts.tags!.some((t) => e.tags.includes(t)))
  }
  if (opts?.minConfidence) {
    entries = entries.filter((e) => e.confidence >= opts.minConfidence!)
  }

  // Sort by relevance: confidence * recency * usage
  entries.sort((a, b) => {
    const now = Date.now()
    const ageA = (now - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24) // days
    const ageB = (now - new Date(b.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    const scoreA = a.confidence * (1 / (1 + ageA * 0.1)) + a.usageCount * 5
    const scoreB = b.confidence * (1 / (1 + ageB * 0.1)) + b.usageCount * 5
    return scoreB - scoreA
  })

  return entries.slice(0, opts?.limit || 50)
}

export function updateMemoryConfidence(id: string, delta: number) {
  const store = loadMemory()
  const entry = store.entries.find((e) => e.id === id)
  if (entry) {
    entry.confidence = Math.min(100, Math.max(0, entry.confidence + delta))
    entry.usageCount++
    saveMemory(store)
  }
}

export function deleteMemory(id: string) {
  const store = loadMemory()
  store.entries = store.entries.filter((e) => e.id !== id)
  saveMemory(store)
}

export function incrementConversationCount() {
  const store = loadMemory()
  store.conversationCount++
  saveMemory(store)
}

export function getMemoryStats() {
  const store = loadMemory()
  const byType: Record<string, number> = {}
  let totalConfidence = 0

  for (const e of store.entries) {
    byType[e.type] = (byType[e.type] || 0) + 1
    totalConfidence += e.confidence
  }

  return {
    totalMemories: store.entries.length,
    conversationCount: store.conversationCount,
    avgConfidence: store.entries.length > 0 ? Math.round(totalConfidence / store.entries.length) : 0,
    byType,
    lastUpdated: store.lastUpdated,
    version: store.version,
  }
}

// ─── Similarity (simple word overlap) ──────���─────────────────────────────────
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 3))
  let intersection = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++
  }
  const union = new Set([...wordsA, ...wordsB]).size
  return union > 0 ? intersection / union : 0
}

// ─── Bootstrap Memories (ELI starts with baseline knowledge) ─────────────────
function getBootstrapMemories(): EliMemoryEntry[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'boot_001',
      type: 'learning',
      content: 'Most beta bugs are related to AI builder not producing complete builds — the completeness auditor and auto-retry were added to fix this.',
      source: 'bootstrap',
      confidence: 90,
      timestamp: now,
      usageCount: 0,
      tags: ['ai-builder', 'bugs', 'completeness'],
    },
    {
      id: 'boot_002',
      type: 'pattern',
      content: 'Connection drops between the web editor and Roblox Studio are the #2 most common bug. Usually caused by page refresh losing the WebSocket. Fix: session persistence to localStorage + auto-reconnect.',
      source: 'bootstrap',
      confidence: 85,
      timestamp: now,
      usageCount: 0,
      tags: ['connection', 'studio-plugin', 'websocket'],
    },
    {
      id: 'boot_003',
      type: 'pattern',
      content: 'UI bugs cluster around auth forms (sign-in/sign-up boxes too tight, email fields overflowing). Clerk components need responsive container constraints.',
      source: 'bootstrap',
      confidence: 80,
      timestamp: now,
      usageCount: 0,
      tags: ['ui', 'auth', 'clerk'],
    },
    {
      id: 'boot_004',
      type: 'decision',
      content: 'Gemini is primary AI because of free tier (1M tokens/day). Groq is fallback. When rate-limited (429), retry with exponential backoff before falling back.',
      source: 'bootstrap',
      confidence: 95,
      timestamp: now,
      usageCount: 0,
      tags: ['ai', 'architecture', 'gemini', 'groq'],
    },
    {
      id: 'boot_005',
      type: 'learning',
      content: 'itjustlikethat is the most active bug reporter (10+ bugs, quality reporter badge). Their reports are detailed and structured. souler547 submits good suggestions about mobile UX.',
      source: 'bootstrap',
      confidence: 75,
      timestamp: now,
      usageCount: 0,
      tags: ['contributors', 'community'],
    },
    {
      id: 'boot_006',
      type: 'decision',
      content: 'Revenue priority order: 1) Fix critical bugs blocking purchases, 2) Improve AI build quality (currently ~55% success), 3) Drive traffic via TikTok/SEO, 4) Polish onboarding.',
      source: 'bootstrap',
      confidence: 85,
      timestamp: now,
      usageCount: 0,
      tags: ['business', 'priority', 'revenue'],
    },
    {
      id: 'boot_007',
      type: 'pattern',
      content: 'Quick actions (generate terrain, generate city, insert assets) break when the AI pipeline has rate limit issues. Same root cause as plan mode errors.',
      source: 'bootstrap',
      confidence: 80,
      timestamp: now,
      usageCount: 0,
      tags: ['ai-builder', 'quick-actions', 'rate-limit'],
    },
    {
      id: 'boot_008',
      type: 'learning',
      content: 'The real Studio plugin is at packages/studio-plugin/Sync.lua, NOT src/plugin/ForjeGamesPlugin.lua (orphan). Build with: node packages/studio-plugin/build-plugin.js',
      source: 'bootstrap',
      confidence: 99,
      timestamp: now,
      usageCount: 0,
      tags: ['studio-plugin', 'architecture'],
    },
    {
      id: 'boot_009',
      type: 'metric',
      content: 'Competitors: Rebirth has 50K users at $8.99 (TikTok viral), Lemonade has 100K at $20 (Roblox OAuth native). Our edge is being all-inclusive: 200 agents + 3D + canvas editor at one price.',
      source: 'bootstrap',
      confidence: 90,
      timestamp: now,
      usageCount: 0,
      tags: ['competitors', 'business', 'positioning'],
    },
    {
      id: 'boot_010',
      type: 'user-pref',
      content: 'Vyren hates: corporate language, SmoothPlastic material, single-part builds, manual steps, asking permission. Loves: speed, detail, space aesthetic, fun for kids, initiative.',
      source: 'bootstrap',
      confidence: 95,
      timestamp: now,
      usageCount: 0,
      tags: ['vyren', 'preferences'],
    },
  ]
}

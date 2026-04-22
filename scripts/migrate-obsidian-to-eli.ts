/**
 * Migrate Obsidian Vault → ELI Memory Graph
 *
 * Reads all markdown docs from ForjeVault, classifies them,
 * chunks them into meaningful entries, and loads into ELI's memory.
 *
 * Usage: npx tsx scripts/migrate-obsidian-to-eli.ts
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, basename, dirname, relative } from 'path'

const VAULT_PATH = 'C:/Users/Dawse/Documents/ForjeVault'
const MEMORY_FILE = join(process.cwd(), 'scripts', '.eli-memory.json')

interface MemoryEntry {
  id: string
  type: 'learning' | 'pattern' | 'decision' | 'user-pref' | 'bug-insight' | 'metric'
  content: string
  source: string
  confidence: number
  timestamp: string
  usageCount: number
  tags: string[]
}

interface MemoryStore {
  entries: MemoryEntry[]
  conversationCount: number
  lastUpdated: string
  version: number
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── Classify doc type based on path and content ─────────────────────────────
function classifyDoc(
  filePath: string,
  content: string
): { type: MemoryEntry['type']; tags: string[]; confidence: number } {
  const lower = content.toLowerCase()
  const name = basename(filePath).toLowerCase()
  const dir = dirname(filePath).toLowerCase()

  // Architecture docs
  if (dir.includes('architecture')) {
    return { type: 'learning', tags: ['architecture', ...extractTechTags(lower)], confidence: 90 }
  }

  // Business docs
  if (dir.includes('business')) {
    if (name.includes('competitor') || name.includes('competitive')) {
      return { type: 'metric', tags: ['competitors', 'business'], confidence: 85 }
    }
    if (name.includes('revenue') || name.includes('pricing')) {
      return { type: 'decision', tags: ['business', 'revenue', 'pricing'], confidence: 85 }
    }
    if (name.includes('launch') || name.includes('plan') || name.includes('strategy')) {
      return { type: 'decision', tags: ['business', 'strategy', 'launch'], confidence: 80 }
    }
    return { type: 'decision', tags: ['business'], confidence: 75 }
  }

  // Competitor docs
  if (dir.includes('competitor')) {
    const competitor = name.replace('competitor — ', '').replace('.md', '')
    return { type: 'metric', tags: ['competitors', competitor], confidence: 85 }
  }

  // Engineering docs
  if (dir.includes('engineering')) {
    if (name.includes('bug') || name.includes('blocker')) {
      return { type: 'bug-insight', tags: ['engineering', 'bugs'], confidence: 80 }
    }
    if (name.includes('todo') || name.includes('plan')) {
      return { type: 'decision', tags: ['engineering', 'roadmap'], confidence: 70 }
    }
    if (name.includes('quality') || name.includes('pipeline')) {
      return { type: 'pattern', tags: ['engineering', 'quality'], confidence: 85 }
    }
    return { type: 'learning', tags: ['engineering'], confidence: 80 }
  }

  // Patterns
  if (dir.includes('pattern')) {
    return { type: 'pattern', tags: ['pattern', ...extractTechTags(lower)], confidence: 90 }
  }

  // Preferences
  if (dir.includes('claude') || name.includes('preference')) {
    return { type: 'user-pref', tags: ['vyren', 'preferences'], confidence: 95 }
  }

  // Templates
  if (dir.includes('template')) {
    return { type: 'learning', tags: ['templates', 'roblox'], confidence: 75 }
  }

  // Root docs
  if (name.includes('bug fix') || name.includes('luau')) {
    return { type: 'bug-insight', tags: ['engineering', 'bugs'], confidence: 85 }
  }
  if (name.includes('env') || name.includes('setup')) {
    return { type: 'learning', tags: ['setup', 'configuration'], confidence: 80 }
  }
  if (name.includes('pipeline') || name.includes('verification')) {
    return { type: 'pattern', tags: ['engineering', 'architecture'], confidence: 85 }
  }

  return { type: 'learning', tags: ['general'], confidence: 65 }
}

function extractTechTags(content: string): string[] {
  const tags: string[] = []
  if (content.includes('gemini') || content.includes('groq') || content.includes('ai provider')) tags.push('ai')
  if (content.includes('clerk') || content.includes('auth')) tags.push('auth')
  if (content.includes('stripe') || content.includes('billing') || content.includes('payment')) tags.push('billing')
  if (content.includes('studio') || content.includes('plugin') || content.includes('roblox')) tags.push('studio-plugin')
  if (content.includes('websocket') || content.includes('connection')) tags.push('connection')
  if (content.includes('prisma') || content.includes('database') || content.includes('postgres')) tags.push('database')
  if (content.includes('redis') || content.includes('upstash')) tags.push('redis')
  if (content.includes('vercel') || content.includes('deploy')) tags.push('deployment')
  if (content.includes('rag') || content.includes('embedding') || content.includes('vector')) tags.push('rag')
  if (content.includes('discord')) tags.push('discord')
  if (content.includes('mcp') || content.includes('agent')) tags.push('agents')
  return tags
}

// ─── Smart Chunking ──────────────────────────────────────────────────────────
// Break docs into meaningful chunks — by heading sections, not arbitrary splits
function chunkDocument(content: string, maxChunkSize: number = 800): string[] {
  const chunks: string[] = []

  // Split by ## headings first
  const sections = content.split(/^## /m)

  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed || trimmed.length < 20) continue

    if (trimmed.length <= maxChunkSize) {
      chunks.push(trimmed)
    } else {
      // Split long sections by ### sub-headings
      const subsections = trimmed.split(/^### /m)
      for (const sub of subsections) {
        const subTrimmed = sub.trim()
        if (!subTrimmed || subTrimmed.length < 20) continue

        if (subTrimmed.length <= maxChunkSize) {
          chunks.push(subTrimmed)
        } else {
          // Split by paragraphs as last resort
          const paragraphs = subTrimmed.split(/\n\n+/)
          let current = ''
          for (const para of paragraphs) {
            if (current.length + para.length > maxChunkSize) {
              if (current.trim()) chunks.push(current.trim())
              current = para
            } else {
              current += (current ? '\n\n' : '') + para
            }
          }
          if (current.trim()) chunks.push(current.trim())
        }
      }
    }
  }

  // If no headings were found, chunk by paragraphs
  if (chunks.length === 0) {
    const paragraphs = content.split(/\n\n+/)
    let current = ''
    for (const para of paragraphs) {
      if (current.length + para.length > maxChunkSize) {
        if (current.trim()) chunks.push(current.trim())
        current = para
      } else {
        current += (current ? '\n\n' : '') + para
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }

  return chunks.filter((c) => c.length >= 30) // Skip tiny fragments
}

// ─── Walk vault directory ────────────────────────────────────────────────────
function walkDir(dir: string): string[] {
  const files: string[] = []
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        // Skip tutorial videos and logs (too noisy)
        if (entry === 'Tutorials' || entry === 'Logs' || entry === '.obsidian') continue
        files.push(...walkDir(full))
      } else if (entry.endsWith('.md')) {
        files.push(full)
      }
    }
  } catch {}
  return files
}

// ─── Main Migration ──────────────────────────────────────────────────────────
function migrate() {
  console.log('Obsidian Vault → ELI Memory Migration')
  console.log(`Vault: ${VAULT_PATH}`)
  console.log('')

  // Load existing memory
  let store: MemoryStore
  try {
    if (existsSync(MEMORY_FILE)) {
      store = JSON.parse(readFileSync(MEMORY_FILE, 'utf-8'))
    } else {
      store = { entries: [], conversationCount: 0, lastUpdated: '', version: 1 }
    }
  } catch {
    store = { entries: [], conversationCount: 0, lastUpdated: '', version: 1 }
  }

  // Remove old obsidian-sourced entries (re-migration)
  const beforeCount = store.entries.length
  store.entries = store.entries.filter(
    (e) => !e.source.startsWith('obsidian:')
  )
  if (beforeCount !== store.entries.length) {
    console.log(`  Removed ${beforeCount - store.entries.length} old obsidian entries`)
  }

  // Walk the vault
  const files = walkDir(VAULT_PATH)
  console.log(`  Found ${files.length} markdown files`)
  console.log('')

  let totalChunks = 0
  let totalEntries = 0

  for (const filePath of files) {
    const relPath = relative(VAULT_PATH, filePath)
    const content = readFileSync(filePath, 'utf-8')

    if (content.trim().length < 50) {
      console.log(`  Skip (too short): ${relPath}`)
      continue
    }

    const { type, tags, confidence } = classifyDoc(filePath, content)
    const chunks = chunkDocument(content)

    console.log(`  ${relPath}: ${chunks.length} chunks → [${type}] tags: ${tags.join(', ')}`)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const entry: MemoryEntry = {
        id: generateId('obs'),
        type,
        content: chunk,
        source: `obsidian:${relPath}#chunk${i}`,
        confidence,
        timestamp: new Date().toISOString(),
        usageCount: 0,
        tags,
      }
      store.entries.push(entry)
      totalEntries++
    }
    totalChunks += chunks.length
  }

  // Sort by confidence descending
  store.entries.sort((a, b) => b.confidence - a.confidence)

  // Save
  store.lastUpdated = new Date().toISOString()
  store.version = 2 // Mark as v2 with obsidian data
  writeFileSync(MEMORY_FILE, JSON.stringify(store, null, 2))

  console.log('')
  console.log('=== Migration Complete ===')
  console.log(`  Files processed: ${files.length}`)
  console.log(`  Chunks created:  ${totalChunks}`)
  console.log(`  Memory entries:  ${store.entries.length} total`)
  console.log(`  Memory file:     ${MEMORY_FILE}`)
  console.log('')

  // Print type breakdown
  const byType: Record<string, number> = {}
  for (const e of store.entries) {
    byType[e.type] = (byType[e.type] || 0) + 1
  }
  console.log('  By type:')
  for (const [t, c] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${t}: ${c}`)
  }

  // Print tag cloud
  const tagCounts: Record<string, number> = {}
  for (const e of store.entries) {
    for (const t of e.tags) {
      tagCounts[t] = (tagCounts[t] || 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15)
  console.log(`\n  Top tags: ${topTags.map(([t, c]) => `${t}(${c})`).join(', ')}`)
}

migrate()

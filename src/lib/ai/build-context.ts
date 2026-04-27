import 'server-only'

// ---------------------------------------------------------------------------
// Build Context — tracks the last build per session so modification requests
// ("make the roof bigger", "change the color to blue") can reference the
// existing code instead of starting from scratch.
//
// Storage: Redis-primary (shared across Lambda instances), in-memory L1 cache.
// Falls back to memory-only when Redis is unavailable.
// ---------------------------------------------------------------------------

export interface BuildContext {
  /** The Luau code of the last build */
  lastCode: string
  /** What the user originally asked for */
  lastPrompt: string
  /** Approximate center position description */
  buildCenter: string
  /** Number of parts in the build */
  partCount: number
  /** Unix ms when the build was created */
  timestamp: number
}

// ---------------------------------------------------------------------------
// Redis helpers
// ---------------------------------------------------------------------------

const REDIS_PREFIX = 'fj:build-ctx:'
const REDIS_TTL_SECS = 1800 // 30 min — covers typical build session

function getRedis(): import('ioredis').Redis | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../redis') as { getRedis?: () => import('ioredis').Redis | null }
    return mod.getRedis ? mod.getRedis() : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// In-memory L1 cache — survives Next.js hot-reload via globalThis
// ---------------------------------------------------------------------------

const g = globalThis as unknown as { __fjBuildContextStore?: Map<string, BuildContext> }
const contextStore: Map<string, BuildContext> = (g.__fjBuildContextStore ??= new Map())
g.__fjBuildContextStore = contextStore

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist the most recent build for a session.
 * Writes to both L1 memory and Redis (fire-and-forget).
 */
export function saveBuildContext(sessionId: string, ctx: BuildContext): void {
  // Trim code to 8 KB for Redis storage — enough for the AI to understand the build
  const trimmed: BuildContext = {
    ...ctx,
    lastCode: ctx.lastCode.slice(0, 8000),
  }
  contextStore.set(sessionId, trimmed)

  const r = getRedis()
  if (r) {
    Promise.resolve(
      r.set(`${REDIS_PREFIX}${sessionId}`, JSON.stringify(trimmed), 'EX', REDIS_TTL_SECS),
    ).catch(() => { /* Redis unavailable */ })
  }
}

/**
 * Retrieve the last build context for a session.
 * L1-first, falls back to Redis on miss.
 */
export async function getBuildContext(sessionId: string): Promise<BuildContext | null> {
  // L1 hit
  const mem = contextStore.get(sessionId)
  if (mem) return mem

  // Redis fallback
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(`${REDIS_PREFIX}${sessionId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BuildContext
    // Hydrate L1
    contextStore.set(sessionId, parsed)
    return parsed
  } catch {
    return null
  }
}

/**
 * Synchronous L1-only lookup (for hot paths that cannot await).
 */
export function getBuildContextSync(sessionId: string): BuildContext | null {
  return contextStore.get(sessionId) ?? null
}

/**
 * Clear the build context for a session.
 */
export function clearBuildContext(sessionId: string): void {
  contextStore.delete(sessionId)
  const r = getRedis()
  if (r) {
    Promise.resolve(r.del(`${REDIS_PREFIX}${sessionId}`)).catch(() => {})
  }
}

// ---------------------------------------------------------------------------
// Modification detection
// ---------------------------------------------------------------------------

/**
 * Heuristic check: does the user want to MODIFY the last build rather than
 * create something entirely new?
 *
 * This intentionally casts a wide net — false positives are harmless (the AI
 * just gets extra context about the previous build) while false negatives mean
 * the user's modification request rebuilds from scratch.
 */
export function isModificationRequest(message: string): boolean {
  const m = message.toLowerCase().trim()

  // Short messages with pronouns like "make it blue" almost always refer to the last build
  const pronounRef = /\b(it|them|this|that|the build|the model|my build|what you (just )?(built|made|created))\b/i

  const patterns: RegExp[] = [
    // Scale/size changes
    /\bmake\s+(it|them|the\s+\w+)\s+(bigger|smaller|taller|shorter|wider|thinner|longer|narrower|larger|huge|tiny|massive)/i,
    /\b(resize|rescale|stretch|shrink|enlarge|expand|compress)\b/i,
    /\b(scale\s+(it|them|up|down))\b/i,

    // Color/material changes
    /\b(change|set|make)\s+(the\s+)?(color|colour|material|texture)\b/i,
    /\bmake\s+(it|them|the\s+\w+)\s+(red|blue|green|yellow|purple|orange|pink|white|black|gray|grey|brown|gold|silver|darker|lighter|brighter|transparent|invisible|neon)\b/i,
    /\b(paint|recolor|repaint)\b/i,
    /\b(change|switch)\s+(it|them|the\s+\w+)\s+to\s+(red|blue|green|yellow|purple|orange|pink|white|black|brown|wood|brick|metal|glass|concrete|marble|slate|stone|neon)\b/i,

    // Component modifications
    /\bmake\s+the\s+(roof|walls?|door|windows?|floor|ceiling|tower|fence|chimney|porch|balcony|stairs?|foundation|column|pillar|beam)\s+(bigger|smaller|taller|shorter|wider|red|blue|green|different)\b/i,
    /\b(add|put|place)\s+(a\s+|some\s+|more\s+)?\w+\s+(to|on|inside|next\s+to|near|around|beside|on\s+top)\s+(it|the|my|this)\b/i,
    /\b(remove|delete|get\s+rid\s+of|take\s+away|take\s+off)\s+(the|a|some)\s+\w+/i,

    // Position/rotation
    /\b(move|shift|slide|push|pull|nudge)\s+(it|them|the\s+\w+)/i,
    /\b(rotate|turn|flip|spin|mirror)\s+(it|them|the\s+\w+)/i,

    // Detail level
    /\b(more|less|add(ing)?)\s+(detail|details|decoration|decorations|windows?|lights?|furniture|landscaping|plants?|trees?)\b/i,

    // Generic modification language
    /\bchange\s+\w+\s+to\s+\w+/i,
    /\b(tweak|adjust|modify|edit|fix|update|improve|enhance)\s+(it|them|the|this|my)/i,
    /\bcan\s+you\s+(make|change|add|remove|move|rotate|resize)/i,

    // "instead" / "actually" corrections
    /\b(actually|instead|rather|wait)\s*,?\s*(make|change|do|use|can)/i,
  ]

  for (const p of patterns) {
    if (p.test(m)) return true
  }

  // Short message (under 40 chars) with a pronoun reference = almost certainly a modification
  if (m.length < 40 && pronounRef.test(m)) return true

  return false
}

// ---------------------------------------------------------------------------
// Prompt injection for modification requests
// ---------------------------------------------------------------------------

/**
 * Build the modification context string to inject into the AI system prompt.
 * Returns empty string if no build context is available.
 */
export function formatModificationPrompt(buildCtx: BuildContext, userMessage: string): string {
  // Truncate code to 4000 chars for prompt injection — keeps token count manageable
  const codeSample = buildCtx.lastCode.slice(0, 4000)
  const truncated = buildCtx.lastCode.length > 4000 ? '\n-- [... code truncated for context ...]' : ''

  return `
=== PREVIOUS BUILD (modify this — do NOT start from scratch) ===
The user previously built: "${buildCtx.lastPrompt}"
Part count: ${buildCtx.partCount} parts
Built ${Math.round((Date.now() - buildCtx.timestamp) / 1000)}s ago

Here is the existing code:
\`\`\`lua
${codeSample}${truncated}
\`\`\`
=== END PREVIOUS BUILD ===

MODIFICATION REQUEST: "${userMessage}"
Keep ALL existing parts. Only change what the user asked for. Output the COMPLETE modified code (not just the changes).
If the user asks to add something, add it TO the existing build model. If they ask to change a property, find the relevant parts and update them.
The existing build's model is named "ForjeAI_Build" — find it with workspace:FindFirstChild("ForjeAI_Build", true).
`
}

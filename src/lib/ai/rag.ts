/**
 * RAG (Retrieval-Augmented Generation) pipeline for ForjeGames.
 *
 * Uses Gemini's text-embedding-004 model (free tier, 1500 RPM) to embed prompts,
 * then retrieves the most relevant Roblox documentation chunks from PostgreSQL
 * via pgvector cosine similarity search.
 *
 * The retrieved context is injected into the system prompt before calling the LLM,
 * giving it up-to-date Roblox API knowledge instead of relying on training data.
 *
 * Flow:
 *  1. User prompt comes in
 *  2. embedText() converts it to a 768-dim vector via Gemini
 *  3. retrieveContext() finds top-K relevant doc chunks from the DB
 *  4. buildRAGSystemPrompt() combines base system prompt + retrieved docs
 *  5. callAI() uses this enriched prompt for generation
 */

import 'server-only'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'

// ── Types ───────────────────────────────────────────────────────────────────

export interface DocChunk {
  id: string
  category: string
  title: string
  content: string
  similarity: number
}

export interface RAGContext {
  chunks: DocChunk[]
  totalTokensEstimate: number
}

// ── Embedding via Gemini (free tier: 1500 RPM, 768 dimensions) ─────────────

const EMBED_MODEL = 'text-embedding-004'
const EMBED_DIMENSIONS = 768
const EMBED_CACHE_TTL = 60 * 60 * 24 // 24h — same prompt = same vector

/**
 * Generate a vector embedding for a text string.
 * Uses Redis cache to avoid re-embedding identical prompts.
 */
export async function embedText(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('[rag] GEMINI_API_KEY required for embeddings')

  // Check cache first
  const cacheKey = `embed:${hashText(text)}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as number[]
  } catch { /* Redis unavailable — continue without cache */ }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text: text.slice(0, 2048) }] },
        outputDimensionality: EMBED_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`[rag] Embedding failed: HTTP ${res.status} ${errText}`)
  }

  type EmbedRes = { embedding?: { values?: number[] } }
  const data = (await res.json()) as EmbedRes
  const values = data.embedding?.values
  if (!values || values.length === 0) {
    throw new Error('[rag] Empty embedding response')
  }

  // Cache the result
  try {
    await redis.set(cacheKey, JSON.stringify(values), 'EX', EMBED_CACHE_TTL)
  } catch { /* Redis unavailable — skip cache write */ }

  return values
}

// ── Retrieval — pgvector cosine similarity search ──────────────────────────

const DEFAULT_TOP_K = 6
const SIMILARITY_THRESHOLD = 0.35

/**
 * Retrieve the most relevant documentation chunks for a given prompt.
 * Uses pgvector's cosine distance operator (<=> ) for similarity search.
 */
export async function retrieveContext(
  prompt: string,
  topK: number = DEFAULT_TOP_K,
  categories?: string[],
): Promise<RAGContext> {
  const embedding = await embedText(prompt)
  const vectorStr = `[${embedding.join(',')}]`

  // Build category filter (parameterized to prevent SQL injection)
  const categoryClause = categories?.length
    ? Prisma.sql`AND category = ANY(ARRAY[${Prisma.join(categories)}]::text[])`
    : Prisma.empty

  const chunks = await db.$queryRaw<Array<{
    id: string
    category: string
    title: string
    content: string
    similarity: number
  }>>(Prisma.sql`
    SELECT
      id,
      category,
      title,
      content,
      1 - (embedding <=> ${vectorStr}::vector) as similarity
    FROM "RobloxDocChunk"
    WHERE 1 - (embedding <=> ${vectorStr}::vector) > ${SIMILARITY_THRESHOLD}
    ${categoryClause}
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `)

  const totalTokensEstimate = chunks.reduce(
    (sum, c) => sum + Math.ceil(c.content.length / 4),
    0,
  )

  return { chunks, totalTokensEstimate }
}

// ── Prompt builder — injects retrieved context into system prompt ──────────

const MAX_CONTEXT_TOKENS = 3000 // Don't blow up the context window

/**
 * Build an enriched system prompt by injecting relevant documentation.
 * If retrieval fails or returns nothing, falls back to the original prompt.
 */
export async function buildRAGSystemPrompt(
  baseSystemPrompt: string,
  userPrompt: string,
  categories?: string[],
): Promise<string> {
  try {
    const context = await retrieveContext(userPrompt, DEFAULT_TOP_K, categories)

    if (context.chunks.length === 0) {
      return baseSystemPrompt
    }

    // Trim chunks to fit within token budget
    let tokenBudget = MAX_CONTEXT_TOKENS
    const selectedChunks: DocChunk[] = []
    for (const chunk of context.chunks) {
      const chunkTokens = Math.ceil(chunk.content.length / 4)
      if (tokenBudget - chunkTokens < 0) break
      selectedChunks.push(chunk)
      tokenBudget -= chunkTokens
    }

    if (selectedChunks.length === 0) {
      return baseSystemPrompt
    }

    const contextBlock = selectedChunks
      .map((c) => `### ${c.category}: ${c.title} (relevance: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`)
      .join('\n\n')

    return `${baseSystemPrompt}

--- RELEVANT ROBLOX DOCUMENTATION ---
The following documentation was retrieved based on the user's request. Use this as authoritative reference for API calls, property names, method signatures, and best practices.

${contextBlock}

--- END DOCUMENTATION ---
Use the above documentation to ensure your code is correct and uses current Roblox APIs. If the documentation conflicts with your training data, trust the documentation.`
  } catch (e) {
    console.error('[rag] Context retrieval failed, using base prompt:', (e as Error).message)
    return baseSystemPrompt
  }
}

// ── Ingestion — for seeding the knowledge base ─────────────────────────────

export interface DocChunkInput {
  category: string
  title: string
  content: string
  source?: string
  tags?: string[]
}

/**
 * Ingest a batch of documentation chunks into the vector database.
 * Generates embeddings and stores them alongside the text content.
 */
export async function ingestDocChunks(chunks: DocChunkInput[]): Promise<number> {
  let ingested = 0

  for (const chunk of chunks) {
    try {
      const embedding = await embedText(`${chunk.category} ${chunk.title} ${chunk.content}`)
      const vectorStr = `[${embedding.join(',')}]`

      await db.$executeRawUnsafe(
        `INSERT INTO "RobloxDocChunk" (id, category, title, content, source, tags, embedding, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, NOW(), NOW())
         ON CONFLICT (category, title) DO UPDATE SET
           content = EXCLUDED.content,
           source = EXCLUDED.source,
           tags = EXCLUDED.tags,
           embedding = EXCLUDED.embedding,
           "updatedAt" = NOW()`,
        chunk.category,
        chunk.title,
        chunk.content,
        chunk.source ?? '',
        chunk.tags ?? [],
        vectorStr,
      )
      ingested++

      // Rate limit: Gemini embedding API is 1500 RPM but be gentle
      if (ingested % 50 === 0) {
        await new Promise((r) => setTimeout(r, 1000))
      }
    } catch (e) {
      console.error(`[rag] Failed to ingest "${chunk.title}":`, (e as Error).message)
    }
  }

  return ingested
}

// ── Helper ──────────────────────────────────────────────────────────────────

function hashText(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + ch
    hash = hash & hash // Convert to 32-bit int
  }
  return hash.toString(36)
}

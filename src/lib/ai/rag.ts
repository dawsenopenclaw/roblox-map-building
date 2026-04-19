/**
 * RAG (Retrieval-Augmented Generation) pipeline for ForjeGames.
 *
 * Uses BAAI/bge-base-en-v1.5 (768d) locally via @huggingface/transformers.
 * No API quota, no cost, no rate limits. Model downloads once to HF cache
 * (~438MB) and runs on CPU via ONNX/WASM. On Vercel lambdas, model is
 * cached in /tmp and survives across warm invocations.
 *
 * Flow:
 *  1. User prompt comes in
 *  2. embedText() converts it to a 768-dim vector via local BGE model
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

// ── Embedding via local BGE model (no API, no quota) ─────────────────────

const EMBED_CACHE_TTL = 60 * 60 * 24 // 24h — same prompt = same vector

let embeddingPipeline: any = null

async function getEmbeddingPipeline() {
  if (embeddingPipeline) return embeddingPipeline
  const { pipeline } = await import('@huggingface/transformers')
  console.log('[rag] Loading local embedding model (Xenova/bge-base-en-v1.5)...')
  embeddingPipeline = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', {
    device: 'cpu',
  })
  console.log('[rag] Embedding model loaded.')
  return embeddingPipeline
}

/**
 * Generate a 768-dim vector embedding for a text string.
 * Uses local BGE model — no API calls, no quotas, no cost.
 * Redis cache still used to skip re-embedding identical prompts.
 */
export async function embedText(text: string): Promise<number[]> {
  // Check cache first
  const cacheKey = `embed:${hashText(text)}`
  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached) as number[]
  } catch { /* Redis unavailable — continue without cache */ }

  const pipe = await getEmbeddingPipeline()
  const output = await pipe(text.slice(0, 512), { pooling: 'cls', normalize: true })
  const values = Array.from(output.data as Float32Array)

  if (!values || values.length === 0) {
    throw new Error('[rag] Empty embedding from local model')
  }

  // Cache the result
  try {
    await redis.set(cacheKey, JSON.stringify(values), 'EX', EMBED_CACHE_TTL)
  } catch { /* Redis unavailable — skip cache write */ }

  return values
}

// ── Retrieval — pgvector cosine similarity search ──────────────────────────

// Bumped from 6 → 12 (Apr 16) so the AI sees more of the ingested video
// library per build. With MAX_CONTEXT_TOKENS=6000 below, 12 chunks at
// ~500 tokens each still fits comfortably in any modern LLM context.
const DEFAULT_TOP_K = 12
// 0.30 (was 0.35) admits slightly weaker matches — useful once the corpus
// includes hundreds of videos and the per-prompt best chunk may not be
// strictly category-aligned.
const SIMILARITY_THRESHOLD = 0.30

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

// Bumped from 3000 → 6000 (Apr 16). With Gemini Flash at 1M-token context
// and the orchestrator's prompts well under 30k tokens total, 6k for
// retrieved tutorial context is comfortable and gives the AI dramatically
// more concrete examples to draw from.
const MAX_CONTEXT_TOKENS = 6000

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

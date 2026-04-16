/**
 * Video → RAG + Vault Ingest
 *
 * Single source, two outputs:
 *  1. pgvector chunks (RobloxDocChunk) — auto-retrieved by chat route
 *     during AI builds via buildRAGSystemPrompt() in lib/ai/provider.ts.
 *  2. Markdown digest at ForjeVault/Tutorials/{Category}/{slug}.md —
 *     read on demand by future Claude sessions.
 *
 * Usage:
 *   npx tsx scripts/ingest-video.ts <youtube-url-or-id>
 *   npx tsx scripts/ingest-video.ts <id> --category=service --tags=pathfinding,npc
 *
 * Categories supported (must match retrieval categories used by build-planner.ts):
 *   pattern  — game design patterns (tycoon, obby, simulator, etc.)
 *   building — placement, terrain, lighting, world construction
 *   service  — Roblox services (DataStore, Tween, Pathfinding, etc.)
 *   blender  — Blender modeling, materials, export
 *   dev      — general game dev (architecture, design)
 *
 * Auto-classifies if not specified.
 */

import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { execFileSync } from 'child_process'

// Load prod first so it wins — we want to ingest into Neon (where pgvector
// lives), not the local Postgres. Local .env is a dev fallback only.
dotenv.config({ path: '.env.production.local' })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { embedThrottled } from './lib/embed-throttled'

// Force the Prisma client to use the prod URL (.env.production.local) when
// available — the schema reads `env("DATABASE_URL")` which would otherwise
// hit whichever URL Prisma resolved at import time.
const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? '' } },
})

const TRANSCRIPT_CACHE = path.join(process.cwd(), '.transcripts')

// ── Config ──────────────────────────────────────────────────────────────────

const VAULT_TUTORIALS = 'C:\\Users\\Dawse\\Documents\\ForjeVault\\Tutorials'
const CHUNK_TARGET_CHARS = 2400 // ~600 tokens
const CHUNK_OVERLAP_CHARS = 400 // ~100 tokens overlap

type Category = 'pattern' | 'building' | 'service' | 'blender' | 'dev'

// ── Embedding (mirrors lib/ai/rag.ts to avoid server-only import) ──────────

const embedText = embedThrottled

// ── Video metadata via YouTube oEmbed (no API key needed) ──────────────────

interface VideoMeta {
  videoId: string
  title: string
  author: string
  thumbnailUrl: string
}

function extractVideoId(input: string): string {
  const patterns = [
    /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[?&]|$)/,
    /youtu\.be\/([0-9A-Za-z_-]{11})/,
    /^([0-9A-Za-z_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  throw new Error(`Cannot extract video ID from: ${input}`)
}

// yt-dlp wrapper — single subprocess gets metadata + transcript reliably.
// Requires `pip install yt-dlp` (already on this machine).

function runYtDlp(args: string[]): string {
  try {
    return execFileSync('yt-dlp', args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) {
    throw new Error(`yt-dlp failed: ${(e as Error).message.split('\n')[0]}`)
  }
}

async function fetchMeta(videoId: string): Promise<VideoMeta> {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const out = runYtDlp(['--no-warnings', '--print', '%(title)s\t%(channel)s\t%(thumbnail)s', '--no-playlist', url])
  const [title, author, thumb] = out.trim().split('\t')
  return {
    videoId,
    title: title || `Video ${videoId}`,
    author: author || 'Unknown',
    thumbnailUrl: thumb || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  }
}

// ── Transcript fetch via yt-dlp .vtt + cleanup ─────────────────────────────

function parseVtt(vtt: string): string {
  const lines = vtt.split('\n')
  const out: string[] = []
  let lastLine = ''
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('WEBVTT') || line.startsWith('Kind:') || line.startsWith('Language:')) continue
    if (line.includes('-->')) continue
    if (/^\d+$/.test(line)) continue
    // Strip inline tags like <c> <00:00:01.000>
    const cleaned = line.replace(/<[^>]+>/g, '').trim()
    if (!cleaned) continue
    if (cleaned === lastLine) continue // dedupe (auto-captions repeat)
    out.push(cleaned)
    lastLine = cleaned
  }
  return out
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
}

async function fetchTranscript(videoId: string): Promise<string> {
  fs.mkdirSync(TRANSCRIPT_CACHE, { recursive: true })
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const cached = path.join(TRANSCRIPT_CACHE, `${videoId}.en.vtt`)
  if (!fs.existsSync(cached)) {
    runYtDlp([
      '--skip-download',
      '--write-auto-sub',
      '--write-sub',
      '--sub-lang', 'en',
      '--sub-format', 'vtt',
      '--output', path.join(TRANSCRIPT_CACHE, '%(id)s.%(ext)s'),
      '--no-warnings',
      '--no-playlist',
      url,
    ])
  }
  if (!fs.existsSync(cached)) throw new Error(`No English transcript at ${cached}`)
  const vtt = fs.readFileSync(cached, 'utf-8')
  const text = parseVtt(vtt)
  if (text.length < 100) throw new Error('Transcript too short — probably parse issue')
  return text
}

// ── Auto-classify category from title + transcript head ────────────────────

function classify(title: string, transcript: string): Category {
  const text = `${title} ${transcript.slice(0, 800)}`.toLowerCase()
  if (/blender|cycles|eevee|geometry node|sculpt|uv unwrap|low.?poly modeling/.test(text)) return 'blender'
  if (/datastore|tweenservice|pathfindingservice|httpservice|userinputservice|remoteevent|remotefunction|module ?script|service:/.test(text)) return 'service'
  if (/tycoon|obby|simulator|tower defense|fps|rpg|mmo|game design|monetiz/.test(text)) return 'pattern'
  if (/terrain|build|map|lighting|baseplate|skybox|atmosphere|placement|grid snap/.test(text)) return 'building'
  return 'dev'
}

// ── Chunking — rolling window over the transcript ──────────────────────────

function chunkTranscript(text: string): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + CHUNK_TARGET_CHARS, text.length)
    let chunk = text.slice(i, end)
    // Try to end on a sentence boundary if we're not at EOF
    if (end < text.length) {
      const lastDot = chunk.lastIndexOf('. ')
      if (lastDot > CHUNK_TARGET_CHARS * 0.6) chunk = chunk.slice(0, lastDot + 1)
    }
    chunks.push(chunk.trim())
    i += chunk.length - CHUNK_OVERLAP_CHARS
    if (chunk.length <= CHUNK_OVERLAP_CHARS) break // safety
  }
  return chunks.filter((c) => c.length > 200)
}

// ── pgvector ingest (Track B: site gets smarter) ───────────────────────────

async function ingestChunk(
  category: Category,
  title: string,
  content: string,
  source: string,
  tags: string[],
): Promise<boolean> {
  try {
    const embedding = await embedText(`${category} ${title} ${content}`)
    if (embedding.length === 0) return false
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
      category,
      title,
      content,
      source,
      tags,
      vectorStr,
    )
    return true
  } catch (e) {
    console.error(`  ✗ chunk "${title}": ${(e as Error).message}`)
    return false
  }
}

// ── Vault digest (Track A: future Claude sessions get smarter) ─────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function categoryFolder(c: Category): string {
  if (c === 'blender') return 'Blender'
  if (c === 'dev') return 'Dev'
  return 'Roblox' // pattern, building, service all live under Roblox
}

function writeVaultDigest(meta: VideoMeta, category: Category, transcript: string, chunks: string[]): string {
  const folder = path.join(VAULT_TUTORIALS, categoryFolder(category))
  fs.mkdirSync(folder, { recursive: true })
  const slug = slugify(meta.title)
  const file = path.join(folder, `${slug}.md`)
  const sourceUrl = `https://www.youtube.com/watch?v=${meta.videoId}`
  const headSection = transcript.slice(0, 1200)

  const body = `---
title: ${meta.title.replace(/"/g, "'")}
author: ${meta.author}
category: ${category}
source: ${sourceUrl}
videoId: ${meta.videoId}
ingestedAt: ${new Date().toISOString()}
chunks: ${chunks.length}
---

# ${meta.title}

**Author:** ${meta.author}
**Source:** [${sourceUrl}](${sourceUrl})
**Category:** \`${category}\`
**Chunks ingested to RAG:** ${chunks.length}

## TL;DR (auto-summary from transcript head)

${headSection}${transcript.length > 1200 ? '...' : ''}

## Full Transcript

${transcript}
`
  fs.writeFileSync(file, body, 'utf-8')
  return file
}

function appendIndex(meta: VideoMeta, category: Category, filePath: string): void {
  const indexPath = path.join(VAULT_TUTORIALS, 'INDEX.md')
  const exists = fs.existsSync(indexPath)
  const rel = path.relative(VAULT_TUTORIALS, filePath).replace(/\\/g, '/')
  const line = `- [${meta.title}](${rel}) — ${meta.author} · \`${category}\`\n`
  if (!exists) {
    fs.writeFileSync(
      indexPath,
      `# ForjeGames Tutorial Index\n\nAuto-maintained by \`scripts/ingest-video.ts\`. Each entry is also embedded into pgvector for AI build-time retrieval.\n\n## Videos\n\n${line}`,
      'utf-8',
    )
  } else {
    const current = fs.readFileSync(indexPath, 'utf-8')
    if (current.includes(rel)) return // already indexed
    fs.appendFileSync(indexPath, line)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/ingest-video.ts <youtube-url-or-id> [--category=...] [--tags=a,b,c]')
    process.exit(1)
  }
  const input = args[0]
  const overrideCategory = args.find((a) => a.startsWith('--category='))?.split('=')[1] as Category | undefined
  const tags = args.find((a) => a.startsWith('--tags='))?.split('=')[1]?.split(',').map((t) => t.trim()) ?? []

  const videoId = extractVideoId(input)
  console.log(`🎬 Video: ${videoId}`)

  console.log('📋 Fetching metadata...')
  const meta = await fetchMeta(videoId)
  console.log(`   Title: ${meta.title}`)
  console.log(`   Author: ${meta.author}`)

  console.log('📝 Fetching transcript...')
  const transcript = await fetchTranscript(videoId)
  console.log(`   ${transcript.length} chars (~${Math.round(transcript.length / 4)} tokens)`)

  const category = overrideCategory ?? classify(meta.title, transcript)
  console.log(`🏷️  Category: ${category}`)

  console.log('✂️  Chunking...')
  const chunks = chunkTranscript(transcript)
  console.log(`   ${chunks.length} chunks`)

  console.log('🧠 Embedding + storing to pgvector (Track B: site gets smarter)...')
  let stored = 0
  for (let i = 0; i < chunks.length; i++) {
    const ok = await ingestChunk(
      category,
      `${meta.title} — part ${i + 1}/${chunks.length}`,
      chunks[i],
      `https://www.youtube.com/watch?v=${meta.videoId}&t=${i * 60}s`,
      [...tags, 'video', 'youtube', meta.author.toLowerCase().replace(/\s+/g, '-')],
    )
    if (ok) stored++
  }
  console.log(`   ${stored}/${chunks.length} stored`)

  console.log('📚 Writing vault digest (Track A: Claude sessions get smarter)...')
  const file = writeVaultDigest(meta, category, transcript, chunks)
  appendIndex(meta, category, file)
  console.log(`   ${file}`)

  console.log(`\n✅ Done — ${stored} chunks live in RAG, digest at ${path.basename(file)}`)
}

main()
  .catch((e) => {
    console.error('💥 Failed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

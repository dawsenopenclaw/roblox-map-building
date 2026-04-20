/**
 * Bulk-ingest every video from a YouTube channel into RAG + ForjeVault.
 *
 * Usage:
 *   npx tsx scripts/ingest-channel.ts <channel-url-or-handle> [--limit=N] [--category=...]
 *
 * Examples:
 *   npx tsx scripts/ingest-channel.ts "https://www.youtube.com/@AlvinBlox"
 *   npx tsx scripts/ingest-channel.ts "@TheDevKing" --limit=20 --category=service
 *   npx tsx scripts/ingest-channel.ts "@BlenderGuru" --category=blender
 *
 * Skips videos already in RAG (matched by source URL).
 * Spawns ingest-video.ts as a child process per video so failures isolate.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { execFileSync, spawnSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

interface ChannelArgs {
  channel: string
  limit: number | null
  category: string | null
}

function parseArgs(): ChannelArgs {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.error('Usage: npx tsx scripts/ingest-channel.ts <channel-url-or-handle> [--limit=N] [--category=...]')
    process.exit(1)
  }
  const limit = args.find((a) => a.startsWith('--limit='))?.split('=')[1]
  const category = args.find((a) => a.startsWith('--category='))?.split('=')[1] ?? null
  return {
    channel: args[0],
    limit: limit ? parseInt(limit, 10) : null,
    category,
  }
}

function normalizeChannel(input: string): string {
  if (input.startsWith('http')) return input
  if (input.startsWith('@')) return `https://www.youtube.com/${input}/videos`
  return `https://www.youtube.com/@${input}/videos`
}

function listChannelVideos(channelUrl: string, limit: number | null): Array<{ id: string; title: string }> {
  const args = [
    '--flat-playlist',
    '--print', '%(id)s\t%(title)s',
    '--no-warnings',
    channelUrl,
  ]
  if (limit) args.unshift('--playlist-end', String(limit))
  const out = execFileSync('yt-dlp', args, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 })
  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [id, ...titleParts] = line.split('\t')
      return { id, title: titleParts.join('\t') }
    })
    .filter((v) => v.id && v.id.length === 11)
}

async function alreadyIngested(videoId: string): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) as count FROM "RobloxDocChunk" WHERE source LIKE $1`,
    `https://www.youtube.com/watch?v=${videoId}%`,
  )
  return Number(rows[0]?.count ?? 0) > 0
}

async function ingestOne(videoId: string, category: string | null): Promise<boolean> {
  const args = ['scripts/ingest-video.ts', `https://www.youtube.com/watch?v=${videoId}`]
  if (category) args.push(`--category=${category}`)
  const result = spawnSync('npx', ['tsx', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env },
    shell: process.platform === 'win32',
  })
  return result.status === 0
}

async function main() {
  const { channel, limit, category } = parseArgs()
  const channelUrl = normalizeChannel(channel)
  console.log(`📺 Channel: ${channelUrl}`)
  console.log(`   Listing videos${limit ? ` (limit ${limit})` : ''}...`)

  const videos = listChannelVideos(channelUrl, limit)
  console.log(`   Found ${videos.length} videos`)

  let ingested = 0
  let skipped = 0
  let failed = 0

  for (const [i, v] of videos.entries()) {
    const prefix = `[${i + 1}/${videos.length}]`
    if (await alreadyIngested(v.id)) {
      console.log(`${prefix} ⏭️  skip (already ingested): ${v.title.slice(0, 60)}`)
      skipped++
      continue
    }
    console.log(`${prefix} 🎬 ${v.title.slice(0, 60)}`)
    try {
      const ok = await ingestOne(v.id, category)
      if (ok) ingested++
      else failed++
    } catch (e) {
      console.error(`   ✗ ${(e as Error).message}`)
      failed++
    }
    // Small delay so we don't hammer YouTube and Gemini
    await new Promise((r) => setTimeout(r, 1500))
  }

  console.log(`\n✅ Channel ingest complete:`)
  console.log(`   ingested: ${ingested}  skipped: ${skipped}  failed: ${failed}`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error('💥', e)
  process.exit(1)
})

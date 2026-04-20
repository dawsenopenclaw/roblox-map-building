/**
 * Quick smoke test: query the RAG to verify ingested content can be retrieved.
 * Uses local BGE embeddings — no API calls, no quota limits.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const queries = [
  'how do I make a tycoon game in roblox',
  'how to add a leaderboard to my game',
  'roblox studio explorer panel',
  'Lua scripting basics for beginners',
]

for (const q of queries) {
  console.log(`\n🔍 "${q}"`)
  const emb = await embedLocal(q)
  const vectorStr = `[${emb.join(',')}]`
  const rows = await db.$queryRawUnsafe<
    Array<{ category: string; title: string; similarity: number; preview: string }>
  >(
    `SELECT category, title,
            1 - (embedding <=> $1::vector) AS similarity,
            LEFT(content, 140) AS preview
     FROM "RobloxDocChunk"
     ORDER BY embedding <=> $1::vector
     LIMIT 3`,
    vectorStr,
  )
  for (const r of rows) {
    console.log(`  [${(r.similarity * 100).toFixed(0)}%] ${r.category} · ${r.title}`)
    console.log(`         ${r.preview.replace(/\s+/g, ' ').slice(0, 120)}...`)
  }
}

await db.$disconnect()

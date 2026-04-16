/**
 * Quick smoke test: query the RAG to verify ingested content can be retrieved.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

async function embedText(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY!
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text: text.slice(0, 2048) }] },
        outputDimensionality: 768,
      }),
    },
  )
  if (!res.ok) throw new Error(`embed: ${res.status}`)
  const data = (await res.json()) as { embedding?: { values?: number[] } }
  return data.embedding?.values ?? []
}

const queries = [
  'how do I make a tycoon game in roblox',
  'how to add a leaderboard to my game',
  'roblox studio explorer panel',
  'Lua scripting basics for beginners',
]

for (const q of queries) {
  console.log(`\n🔍 "${q}"`)
  const emb = await embedText(q)
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

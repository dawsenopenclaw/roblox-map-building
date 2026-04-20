/**
 * Re-embed all existing chunks with local BGE model.
 *
 * Required after switching from Gemini (gemini-embedding-001) to
 * BAAI/bge-base-en-v1.5 — different vector spaces can't be searched
 * together.
 *
 * UPSERT on (category, title) so re-running is idempotent.
 * At ~100ms/embed this takes ~2min for 1000 chunks.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const rows = await db.$queryRawUnsafe<Array<{
  id: string; category: string; title: string; content: string
}>>(
  `SELECT id, category, title, content FROM "RobloxDocChunk" ORDER BY id`,
)

console.log(`🔄 Re-embedding ${rows.length} chunks with local BGE model...`)
let ok = 0
let fail = 0
const start = Date.now()

for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  try {
    const text = `${r.category} ${r.title} ${r.content}`
    const embedding = await embedLocal(text)
    const vectorStr = `[${embedding.join(',')}]`
    await db.$executeRawUnsafe(
      `UPDATE "RobloxDocChunk" SET embedding = $1::vector, "updatedAt" = NOW() WHERE id = $2`,
      vectorStr,
      r.id,
    )
    ok++
  } catch (e) {
    console.error(`  ✗ ${r.title}: ${(e as Error).message.slice(0, 80)}`)
    fail++
  }
  if ((i + 1) % 50 === 0) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(0)
    console.log(`  ${i + 1}/${rows.length} (${ok} ok, ${fail} failed) — ${elapsed}s`)
  }
}

const total = ((Date.now() - start) / 1000).toFixed(0)
console.log(`\n✅ Done in ${total}s: ${ok} re-embedded, ${fail} failed`)
await db.$disconnect()

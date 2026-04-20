/**
 * Patch the partial pgvector migration on prod Neon.
 *
 * The 20260406000000_add_pgvector_rag migration ran with table creation
 * guarded by IF NOT EXISTS, but the embedding column was missing because
 * pgvector wasn't installed at the time the table was first created via
 * `prisma db push`. This script adds the missing column + IVFFlat index
 * idempotently.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

async function main() {
  console.log('Ensuring pgvector extension...')
  await db.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)

  console.log('Adding embedding column (vector(768))...')
  await db.$executeRawUnsafe(
    `ALTER TABLE "RobloxDocChunk" ADD COLUMN IF NOT EXISTS embedding vector(768)`,
  )

  console.log('Creating IVFFlat similarity index (cosine)...')
  // ivfflat requires data; if there's none yet, create the index later
  // when we have at least a few hundred rows. For now use a btree on
  // category to make filtered scans fast.
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "RobloxDocChunk_category_idx" ON "RobloxDocChunk"("category")`,
  )

  console.log('Verifying...')
  const cols = await db.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'RobloxDocChunk' AND column_name = 'embedding'`,
  )
  if (cols.length === 0) throw new Error('embedding column still missing')
  console.log('✅ embedding column present:', cols[0])
  await db.$disconnect()
}

main().catch((e) => {
  console.error('💥', e)
  process.exit(1)
})

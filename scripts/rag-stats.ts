import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const counts = await db.$queryRawUnsafe<Array<{ category: string; count: bigint }>>(
  'SELECT category, COUNT(*)::int as count FROM "RobloxDocChunk" GROUP BY category ORDER BY count DESC',
)
console.log('Chunks by category:')
console.table(counts)

const total = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
  'SELECT COUNT(*)::int as count FROM "RobloxDocChunk"',
)
console.log(`\nTotal chunks: ${total[0]?.count}`)

const topSources = await db.$queryRawUnsafe<Array<{ host: string; count: bigint }>>(
  `SELECT regexp_replace(source, '^https?://([^/]+).*', '\\1') as host, COUNT(*)::int as count
   FROM "RobloxDocChunk"
   WHERE source != ''
   GROUP BY host
   ORDER BY count DESC
   LIMIT 10`,
)
console.log('\nTop sources:')
console.table(topSources)

await db.$disconnect()

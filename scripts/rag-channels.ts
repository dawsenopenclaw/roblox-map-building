import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const rows = await db.$queryRawUnsafe<Array<{ channel: string; cat: string; cnt: number }>>(
  `SELECT tags[4] as channel, category as cat, COUNT(*)::int as cnt
   FROM "RobloxDocChunk"
   WHERE source LIKE '%youtube.com%' AND array_length(tags, 1) >= 4
   GROUP BY tags[4], category
   ORDER BY cnt DESC
   LIMIT 30`,
)
console.log('Video chunks by channel:')
console.table(rows)

const titles = await db.$queryRawUnsafe<Array<{ title: string; cat: string }>>(
  `SELECT DISTINCT regexp_replace(title, ' — part \\d+/\\d+$', '') as title, category as cat
   FROM "RobloxDocChunk"
   WHERE source LIKE '%youtube.com%'
   ORDER BY title
   LIMIT 80`,
)
console.log('\nAll video titles:')
for (const t of titles) console.log(`  [${t.cat}] ${t.title}`)
await db.$disconnect()

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

// Find garbage: chunks whose titles/sources clearly don't relate to Roblox, Blender, or game dev
const rows = await db.$queryRawUnsafe<Array<{ title: string; source: string; category: string; count: bigint }>>(
  `SELECT
     regexp_replace(title, ' — part \\d+/\\d+$', '') as title,
     source,
     category,
     COUNT(*)::int as count
   FROM "RobloxDocChunk"
   WHERE source LIKE '%youtube.com%'
   GROUP BY regexp_replace(title, ' — part \\d+/\\d+$', ''), source, category
   ORDER BY title
   LIMIT 300`,
)

const GARBAGE_KEYWORDS = [
  'crash course', 'geology', 'latin american', 'scientific thinking',
  'excel', 'quickbooks', 'confluence', 'jira', 'mail merge',
  'wordpress', 'android to laptop', 'subtitles', 'davinci resolve',
  'acrobat', 'second monitor', 'softr', 'google forms', 'openclaw',
  'makeup your face', 'investor day', 'friends are back',
  'writing workshop', 'sound design', 'learnathon',
  'kevin stratvert', 'fireship', 'penetrated by a rat',
  'anthropic leaks', 'cursor ditches', 'browser',
]

let garbageCount = 0
let goodCount = 0
const garbageTitles: string[] = []

for (const r of rows) {
  const lower = `${r.title} ${r.source}`.toLowerCase()
  const isGarbage = GARBAGE_KEYWORDS.some(kw => lower.includes(kw))
  if (isGarbage) {
    garbageCount += Number(r.count)
    garbageTitles.push(`  ✗ [${r.category}] ${r.title} (${r.count} chunks)`)
  } else {
    goodCount += Number(r.count)
  }
}

console.log(`\n🗑️  GARBAGE: ${garbageCount} chunks across ${garbageTitles.length} videos`)
console.log(`✅ GOOD: ${goodCount} chunks`)
console.log(`\nGarbage videos:`)
for (const t of garbageTitles.slice(0, 40)) console.log(t)
if (garbageTitles.length > 40) console.log(`  ... and ${garbageTitles.length - 40} more`)

await db.$disconnect()

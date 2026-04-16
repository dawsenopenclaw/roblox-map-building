/**
 * Reads .transcripts/channels.json (output of discover-channels.ts), picks
 * the top N by score, and runs ingest-channel.ts on each.
 *
 * Usage:
 *   npx tsx scripts/ingest-discovered.ts                      # top 30, 5 vids each
 *   npx tsx scripts/ingest-discovered.ts --top=50 --per=10
 *   npx tsx scripts/ingest-discovered.ts --min-score=50       # all >= score
 *   npx tsx scripts/ingest-discovered.ts --category=blender   # one category only
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import * as fs from 'fs'
import * as path from 'path'
import { spawnSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

interface Discovered {
  channelId: string
  channel: string
  channelUrl: string
  subscriberCount: number
  category: string
  score: number
}

const args = process.argv.slice(2)
const top = parseInt(args.find((a) => a.startsWith('--top='))?.split('=')[1] ?? '30', 10)
const per = parseInt(args.find((a) => a.startsWith('--per='))?.split('=')[1] ?? '5', 10)
const minScore = parseInt(args.find((a) => a.startsWith('--min-score='))?.split('=')[1] ?? '0', 10)
const onlyCategory = args.find((a) => a.startsWith('--category='))?.split('=')[1] ?? null

const file = path.join(process.cwd(), '.transcripts', 'channels.json')
if (!fs.existsSync(file)) {
  console.error('No channels.json. Run discover-channels.ts first.')
  process.exit(1)
}
const all = JSON.parse(fs.readFileSync(file, 'utf-8')) as Discovered[]

let pool = all
if (onlyCategory) pool = pool.filter((c) => c.category === onlyCategory)
if (minScore) pool = pool.filter((c) => c.score >= minScore)
pool.sort((a, b) => b.score - a.score)
const selected = pool.slice(0, top)

console.log(`📚 Bulk ingest from discovery: ${selected.length} channels × ${per} videos = up to ${selected.length * per} videos`)
console.log(`   Filters: ${onlyCategory ?? 'all categories'}${minScore ? `, score>=${minScore}` : ''}`)
console.log(`   Top 5 in selection:`)
for (const c of selected.slice(0, 5)) {
  console.log(`     ${c.score} · ${c.subscriberCount.toLocaleString().padStart(10)} subs · [${c.category}] ${c.channel}`)
}

const logPath = path.join(process.cwd(), '.transcripts', 'discovered-ingest.log')
fs.appendFileSync(logPath, `\n=== ${new Date().toISOString()} top=${top} per=${per} ===\n`)

let okCount = 0
let failCount = 0

for (const [i, ch] of selected.entries()) {
  const prefix = `\n[${i + 1}/${selected.length}] ${ch.channel} (${ch.category}, ${ch.subscriberCount.toLocaleString()} subs)`
  console.log(prefix)
  fs.appendFileSync(logPath, prefix + '\n')

  const result = spawnSync(
    'npx',
    ['tsx', 'scripts/ingest-channel.ts', ch.channelUrl, `--limit=${per}`, `--category=${ch.category}`],
    { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env }, shell: process.platform === 'win32' },
  )

  if (result.status === 0) {
    okCount++
    fs.appendFileSync(logPath, `  OK\n`)
  } else {
    failCount++
    fs.appendFileSync(logPath, `  FAILED status=${result.status}\n`)
  }
}

console.log(`\n🎓 Done: ${okCount} channels ingested, ${failCount} failed.`)
console.log(`   Log: ${logPath}`)
await db.$disconnect()

/**
 * Bulk-ingest the entire curated channel list into RAG + ForjeVault.
 *
 * Usage:
 *   npx tsx scripts/ingest-curated.ts                  # 5 videos per channel
 *   npx tsx scripts/ingest-curated.ts --per-channel=20
 *   npx tsx scripts/ingest-curated.ts --priority=high  # only high-priority
 *
 * Run overnight. Progress is appended to .transcripts/ingest.log.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { CURATED } from './curated-channels'

const args = process.argv.slice(2)
const perChannel = parseInt(args.find((a) => a.startsWith('--per-channel='))?.split('=')[1] ?? '5', 10)
const priorityFilter = args.find((a) => a.startsWith('--priority='))?.split('=')[1] as 'high' | 'medium' | 'low' | undefined

const channels = priorityFilter ? CURATED.filter((c) => c.priority === priorityFilter) : CURATED
console.log(`📚 Curated ingest: ${channels.length} channels, ${perChannel} videos each`)
console.log(`   Estimated total: ${channels.length * perChannel} videos`)

const logPath = path.join(process.cwd(), '.transcripts', 'ingest.log')
fs.mkdirSync(path.dirname(logPath), { recursive: true })
fs.appendFileSync(logPath, `\n\n=== ${new Date().toISOString()} — curated run ===\n`)

let totalDone = 0
let totalSkipped = 0
let totalFailed = 0

for (const [i, ch] of channels.entries()) {
  const prefix = `\n[CHANNEL ${i + 1}/${channels.length}] @${ch.handle} (${ch.defaultCategory}, ${ch.priority ?? 'medium'})`
  console.log(prefix)
  fs.appendFileSync(logPath, `${prefix}\n`)

  const result = spawnSync(
    'npx',
    ['tsx', 'scripts/ingest-channel.ts', `@${ch.handle}`, `--limit=${perChannel}`, `--category=${ch.defaultCategory}`],
    { stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env }, shell: process.platform === 'win32' },
  )

  if (result.status === 0) {
    totalDone++
    fs.appendFileSync(logPath, `  OK\n`)
  } else {
    totalFailed++
    fs.appendFileSync(logPath, `  FAILED status=${result.status}\n`)
  }
}

console.log(`\n🎓 Curated ingest complete:`)
console.log(`   channels processed OK: ${totalDone}`)
console.log(`   channels failed: ${totalFailed}`)
console.log(`   log: ${logPath}`)

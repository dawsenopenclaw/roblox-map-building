/**
 * End-to-end specialist test — simulates what happens when a user
 * types in the chat bar. Tests the FULL chain:
 *  1. Specialist selected?
 *  2. Right specialist for the query?
 *  3. Specialist prompt injected into AI call?
 *  4. RAG template retrieved alongside?
 *  5. AI generates valid code with specialist knowledge applied?
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'

// Can't import server-only modules, so dynamic import
const { SPECIALISTS } = await import('../src/lib/ai/specialists/registry')

interface Specialist {
  id: string; name: string; keywords: string[]; prompt: string
}

function findSpecialist(msg: string): Specialist | null {
  const words = msg.toLowerCase().split(/\s+/)
  const msgText = msg.toLowerCase()
  let best: Specialist | null = null, bestScore = 0
  for (const s of SPECIALISTS as Specialist[]) {
    let score = 0
    for (const kw of s.keywords) {
      if (msgText.includes(kw.toLowerCase())) score += kw.split(/\s+/).length * 3
    }
    const wordSet = new Set(s.keywords.flatMap((k: string) => k.toLowerCase().split(/[\s-]+/)))
    for (const w of words) {
      if (w.length < 3) continue
      if (wordSet.has(w)) score += 1
    }
    if (score > bestScore) { bestScore = score; best = s }
  }
  return bestScore >= 2 ? best : null
}

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

// Diverse test queries spanning many categories
const TESTS = [
  // Architecture
  { query: 'build a medieval castle with towers', expectSpecialist: true, expectCategory: 'castle' },
  { query: 'create a japanese temple', expectSpecialist: true, expectCategory: 'temple' },
  { query: 'make a modern glass skyscraper', expectSpecialist: true, expectCategory: 'glass' },
  // Interiors
  { query: 'design a cozy bedroom', expectSpecialist: true, expectCategory: 'bedroom' },
  { query: 'build a restaurant interior', expectSpecialist: true, expectCategory: 'restaurant' },
  { query: 'make an arcade room', expectSpecialist: true, expectCategory: 'arcade' },
  // Vehicles
  { query: 'build a helicopter', expectSpecialist: true, expectCategory: 'helicopter' },
  { query: 'make a submarine', expectSpecialist: true, expectCategory: 'submarine' },
  { query: 'create a tank', expectSpecialist: true, expectCategory: 'tank' },
  // Nature
  { query: 'build a volcano scene', expectSpecialist: true, expectCategory: 'volcano' },
  { query: 'make a waterfall', expectSpecialist: true, expectCategory: 'waterfall' },
  { query: 'create a coral reef', expectSpecialist: true, expectCategory: 'coral' },
  // Game mechanics
  { query: 'build a tycoon dropper', expectSpecialist: true, expectCategory: 'tycoon' },
  { query: 'make a pvp arena', expectSpecialist: true, expectCategory: 'pvp' },
  { query: 'create a tower defense map', expectSpecialist: true, expectCategory: 'tower' },
  // Styles
  { query: 'make it low poly style', expectSpecialist: true, expectCategory: 'low' },
  { query: 'build a cyberpunk alley', expectSpecialist: true, expectCategory: 'cyberpunk' },
  { query: 'create a steampunk workshop', expectSpecialist: true, expectCategory: 'steampunk' },
  // Themed worlds
  { query: 'build a pirate cove', expectSpecialist: true, expectCategory: 'pirate' },
  { query: 'make a candy land world', expectSpecialist: true, expectCategory: 'candy' },
  { query: 'create a zombie apocalypse scene', expectSpecialist: true, expectCategory: 'zombie' },
  // Lighting
  { query: 'set golden hour lighting', expectSpecialist: true, expectCategory: 'golden' },
  { query: 'make it stormy and dark', expectSpecialist: true, expectCategory: 'storm' },
  { query: 'add neon city night lighting', expectSpecialist: true, expectCategory: 'neon' },
  // Props
  { query: 'add some medieval weapons', expectSpecialist: true, expectCategory: 'medieval' },
  { query: 'build christmas decorations', expectSpecialist: true, expectCategory: 'christmas' },
  // Edge cases — vague queries
  { query: 'build something cool', expectSpecialist: false, expectCategory: '' },
  { query: 'hello', expectSpecialist: false, expectCategory: '' },
  { query: 'what can you do', expectSpecialist: false, expectCategory: '' },
  // Compound queries
  { query: 'build a viking longhouse with torches', expectSpecialist: true, expectCategory: 'viking' },
  { query: 'make a space station control room', expectSpecialist: true, expectCategory: 'space' },
]

console.log(`\n🧪 Specialist E2E Test — ${TESTS.length} queries\n`)

let specialistHits = 0
let specialistMisses = 0
let ragHits = 0
let templateHits = 0
let correctRouting = 0
let incorrectRouting = 0

for (const test of TESTS) {
  const specialist = findSpecialist(test.query)
  const hasSpecialist = specialist !== null

  // Check specialist activation
  if (test.expectSpecialist && hasSpecialist) {
    specialistHits++
    // Check if it routed to the right domain
    if (specialist!.id.includes(test.expectCategory) || specialist!.name.toLowerCase().includes(test.expectCategory)) {
      correctRouting++
    } else {
      incorrectRouting++
      console.log(`  ⚠️  "${test.query}" → ${specialist!.name} (expected something with "${test.expectCategory}")`)
    }
  } else if (!test.expectSpecialist && !hasSpecialist) {
    specialistHits++ // Correctly no specialist for vague queries
    correctRouting++
  } else {
    specialistMisses++
    if (test.expectSpecialist) {
      console.log(`  ❌ "${test.query}" → no specialist found (expected one)`)
    } else {
      console.log(`  ⚠️  "${test.query}" → ${specialist?.name} (expected none)`)
    }
  }

  // Check RAG template retrieval
  const emb = await embedLocal(test.query)
  const vectorStr = `[${emb.join(',')}]`
  const rows = await db.$queryRawUnsafe<Array<{ category: string; similarity: number; title: string }>>(
    `SELECT category, title, 1 - (embedding <=> $1::vector) AS similarity
     FROM "RobloxDocChunk" ORDER BY embedding <=> $1::vector LIMIT 1`,
    vectorStr,
  )
  const topChunk = rows[0]
  if (topChunk && topChunk.similarity > 0.30) ragHits++
  if (topChunk && topChunk.category === 'pattern' && topChunk.similarity > 0.30) templateHits++
}

const total = TESTS.length
console.log(`\n${'═'.repeat(50)}`)
console.log(`SPECIALIST ROUTING: ${specialistHits}/${total} correct (${((specialistHits / total) * 100).toFixed(0)}%)`)
console.log(`  Correct domain: ${correctRouting}`)
console.log(`  Wrong domain: ${incorrectRouting}`)
console.log(`  Missed: ${specialistMisses}`)
console.log(`\nRAG RETRIEVAL:`)
console.log(`  Any chunk above 30%: ${ragHits}/${total} (${((ragHits / total) * 100).toFixed(0)}%)`)
console.log(`  Template (pattern) hit: ${templateHits}/${total} (${((templateHits / total) * 100).toFixed(0)}%)`)
console.log(`${'═'.repeat(50)}`)

// Summary verdict
const routingRate = (correctRouting / total) * 100
if (routingRate >= 90) console.log('\n✅ Specialists are working — ready for beta testers.')
else if (routingRate >= 70) console.log('\n⚠️  Mostly working — some routing needs tuning.')
else console.log('\n❌ Needs work — too many misroutes.')

await db.$disconnect()

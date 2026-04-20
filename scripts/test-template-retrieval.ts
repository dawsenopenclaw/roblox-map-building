/**
 * Test that build templates are retrieved when users ask to build things.
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const queries = [
  // Furniture
  'put a couch in the living room',
  'add a refrigerator to the kitchen',
  'build a piano',
  'make a fish tank',
  // Nature
  'add cherry blossom trees',
  'build a waterfall',
  'make a campfire',
  // Vehicles
  'make a helicopter',
  'build a fire truck',
  'create a submarine',
  // Weapons
  'make a treasure chest',
  'build a magic staff',
  // Structures
  'build a lighthouse',
  'make a treehouse',
  'create a wizard tower',
  'build a gas station',
  // Game mechanics
  'add a teleporter',
  'build a portal',
  'make a dance floor',
  'create a shop counter',
  // Scenes
  'build a desert oasis',
  'make a haunted graveyard',
  'create a crystal cave',
  'build a throne room',
  'make a bowling alley',
  'create a zen garden',
  // Themed
  'build a christmas tree',
  'make a snowman',
  'create a robot mech',
  'build a dragon egg nest',
]

for (const q of queries) {
  const emb = await embedLocal(q)
  const vectorStr = `[${emb.join(',')}]`
  const rows = await db.$queryRawUnsafe<Array<{ category: string; title: string; similarity: number }>>(
    `SELECT category, title, 1 - (embedding <=> $1::vector) AS similarity
     FROM "RobloxDocChunk"
     ORDER BY embedding <=> $1::vector
     LIMIT 1`,
    vectorStr,
  )
  const top = rows[0]
  const hit = top?.category === 'pattern' ? 'HIT' : 'miss'
  const pct = ((top?.similarity ?? 0) * 100).toFixed(0)
  console.log(`[${hit}] "${q}" → ${pct}% ${top?.title?.substring(0, 60)}`)
}

await db.$disconnect()

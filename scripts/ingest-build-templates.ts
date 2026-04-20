/**
 * Ingest ALL curated build templates into RAG as "pattern" category chunks.
 *
 * Pulls from every template file:
 *   - build-template-chunks.ts     (12 basic objects)
 *   - build-template-chunks-mega.ts (10 mega scenes)
 *   - templates-furniture.ts       (35 furniture/interior)
 *   - templates-nature-vehicles.ts (50 nature + vehicles + weapons)
 *   - templates-structures.ts      (13 structures/buildings)
 *   - templates-game-mechanics.ts  (10 game mechanics)
 *   - templates-scenes.ts          (40 scenes/environments)
 *   - templates-themed.ts          (30 themed/fantasy/seasonal)
 *
 * Usage:
 *   npx tsx scripts/ingest-build-templates.ts
 *
 * Idempotent: re-running updates existing chunks (ON CONFLICT upsert).
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local', override: true })

import { PrismaClient } from '@prisma/client'
import { embedLocal } from './lib/embed-local'
import { BUILD_TEMPLATES } from './build-template-chunks'
import { MEGA_TEMPLATES } from './build-template-chunks-mega'
import { FURNITURE_TEMPLATES } from './templates-furniture'
import { NATURE_VEHICLE_TEMPLATES } from './templates-nature-vehicles'
import { STRUCTURE_TEMPLATES } from './templates-structures'
import { GAME_MECHANIC_TEMPLATES } from './templates-game-mechanics'
import { SCENE_TEMPLATES } from './templates-scenes'
import { THEMED_TEMPLATES } from './templates-themed'

const ALL_TEMPLATES = [
  ...BUILD_TEMPLATES,
  ...MEGA_TEMPLATES,
  ...FURNITURE_TEMPLATES,
  ...NATURE_VEHICLE_TEMPLATES,
  ...STRUCTURE_TEMPLATES,
  ...GAME_MECHANIC_TEMPLATES,
  ...SCENE_TEMPLATES,
  ...THEMED_TEMPLATES,
]

const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

async function main() {
  console.log(`\n🏗️  Ingesting ${ALL_TEMPLATES.length} build templates into RAG...`)
  console.log(`   basic: ${BUILD_TEMPLATES.length}`)
  console.log(`   mega: ${MEGA_TEMPLATES.length}`)
  console.log(`   furniture: ${FURNITURE_TEMPLATES.length}`)
  console.log(`   nature/vehicles: ${NATURE_VEHICLE_TEMPLATES.length}`)
  console.log(`   structures: ${STRUCTURE_TEMPLATES.length}`)
  console.log(`   game mechanics: ${GAME_MECHANIC_TEMPLATES.length}`)
  console.log(`   scenes: ${SCENE_TEMPLATES.length}`)
  console.log(`   themed: ${THEMED_TEMPLATES.length}`)
  console.log()

  let ingested = 0
  let failed = 0

  for (const tpl of ALL_TEMPLATES) {
    try {
      const textToEmbed = `${tpl.title}\n${tpl.description}\n${tpl.tags.join(' ')}\n${tpl.code}`
      const embedding = await embedLocal(textToEmbed)
      const vectorStr = `[${embedding.join(',')}]`

      const content = `BUILD TEMPLATE: ${tpl.title}\n${tpl.description}\n\nWORKING CODE:\n\`\`\`lua\n${tpl.code}\n\`\`\``

      await db.$executeRawUnsafe(
        `INSERT INTO "RobloxDocChunk" (id, category, title, content, source, tags, embedding, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::vector, NOW(), NOW())
         ON CONFLICT (category, title) DO UPDATE SET
           content = EXCLUDED.content,
           source = EXCLUDED.source,
           tags = EXCLUDED.tags,
           embedding = EXCLUDED.embedding,
           "updatedAt" = NOW()`,
        'pattern',
        tpl.title,
        content,
        'build-templates',
        tpl.tags,
        vectorStr,
      )

      ingested++
      if (ingested % 10 === 0) {
        console.log(`  ... ${ingested}/${ALL_TEMPLATES.length} ingested`)
      }
    } catch (e) {
      failed++
      console.error(`  ❌ ${tpl.title}: ${(e as Error).message}`)
    }
  }

  console.log(`\n🎯 Done: ${ingested} ingested, ${failed} failed`)
  console.log(`   Total templates in RAG: ${ingested}`)

  await db.$disconnect()
}

main()

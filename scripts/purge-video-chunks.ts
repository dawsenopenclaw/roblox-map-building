import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

console.log('Purging all YouTube-sourced chunks...')
const r = await db.$executeRawUnsafe(`DELETE FROM "RobloxDocChunk" WHERE source LIKE '%youtube.com%'`)
console.log(`Deleted: ${r} chunks`)

const total = await db.$queryRawUnsafe<Array<{ count: number }>>(
  `SELECT COUNT(*)::int as count FROM "RobloxDocChunk"`,
)
console.log(`Remaining (API + seed): ${total[0]?.count}`)
await db.$disconnect()

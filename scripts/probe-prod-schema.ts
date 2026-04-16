import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.production.local' })

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL ?? '' } } })

const cols = await db.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(
  `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'RobloxDocChunk' ORDER BY ordinal_position`,
)
console.log('RobloxDocChunk columns:')
console.table(cols)

const ext = await db.$queryRawUnsafe<Array<{ extname: string; extversion: string }>>(
  `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector'`,
)
console.log('\npgvector extension:')
console.table(ext)

const count = await db.$queryRawUnsafe<Array<{ count: bigint }>>(`SELECT COUNT(*) as count FROM "RobloxDocChunk"`)
console.log(`\nRow count: ${count[0]?.count}`)

await db.$disconnect()

// server-only removed — breaks prerender
import { PrismaClient } from '@prisma/client'
import { serverEnv } from './env'

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined }

let _db: PrismaClient | null = null

export function getDb(): PrismaClient {
  if (_db) return _db
  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma
    return _db
  }
  const instance = new PrismaClient({ log: ['error'] })
  if (serverEnv.NODE_ENV !== 'production') globalForPrisma.prisma = instance
  _db = instance
  return _db
}

// Proxy keeps existing `db.user.findMany(...)` call-sites working unchanged
export const db = new Proxy({} as PrismaClient, {
  get: (_, prop) => {
    const client = getDb()
    const val = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof val === 'function' ? val.bind(client) : val
  },
})

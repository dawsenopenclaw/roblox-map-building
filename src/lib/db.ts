import { PrismaClient } from '@prisma/client'
import { serverEnv } from './env'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({ log: ['error'] })

if (serverEnv.NODE_ENV !== 'production') globalForPrisma.prisma = db

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Temporarily disable caching to force reload of Prisma Client
export const db = new PrismaClient({
  log: ['query'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
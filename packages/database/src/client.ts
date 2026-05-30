import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config as loadEnv } from "dotenv"
import { resolve } from "node:path"

loadEnv({ path: resolve(process.cwd(), ".env"), quiet: true })
loadEnv({ path: resolve(process.cwd(), "../../.env"), quiet: true })

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing")
  }

  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl)
  })
}

export const prisma =
  globalForPrisma.prisma ||
  createPrismaClient()

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma

export default prisma

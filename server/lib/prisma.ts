import { PrismaClient } from "@prisma/client";

if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
  process.env.PRISMA_CLIENT_ENGINE_TYPE = "binary";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

const shouldInitPrisma = Boolean(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  (shouldInitPrisma
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      })
    : null);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Prisma client singleton.
 *
 * Uses Neon adapter when database URL is present, and keeps a single client in dev
 * to avoid exhausting connections during hot reload.
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl =
    process.env.DATABASE_URL ?? "postgres://invalid:invalid@localhost:5432/invalid";

  const adapter = new PrismaNeon({ connectionString: databaseUrl });

  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

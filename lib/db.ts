import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy: constructing/importing this module never touches the database.
// The real PrismaClient is created only when a property (e.g. prisma.patient)
// is first accessed at request time — so Vercel's build-time module evaluation
// can't trigger a PrismaClientInitializationError.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getClient();
    const value = client[prop as keyof PrismaClient];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});

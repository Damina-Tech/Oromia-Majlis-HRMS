import { PrismaClient } from "@prisma/client";

/**
 * Single shared Prisma client for the whole API process.
 * Creating `new PrismaClient()` per module opens a separate connection pool each —
 * under `tsx watch` that quickly exhausts Postgres (`sorry, too many clients already`).
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionLimit = Math.max(1, Number(process.env.PRISMA_CONNECTION_LIMIT) || 5);
  const url = process.env.DATABASE_URL;
  // Keep the pool small so hot-reload + concurrent requests cannot blow max_connections.
  const datasourceUrl =
    url && !/[?&]connection_limit=/.test(url)
      ? `${url}${url.includes("?") ? "&" : "?"}connection_limit=${connectionLimit}&pool_timeout=20`
      : url;

  return new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.PRISMA_LOG === "1" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

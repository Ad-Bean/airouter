import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Enhanced connection health check and retry logic with backoff
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  backoffMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(
        `Database operation attempt ${attempt}/${retries} failed:`,
        error
      );

      // Check if it's a connection error that we should retry
      const isRetryableError =
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error.code === "P5010" ||
          error.code === "P1001" ||
          error.code === "P1002");

      if (attempt === retries || !isRetryableError) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = backoffMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// Ensure clean connections and handle connection issues
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

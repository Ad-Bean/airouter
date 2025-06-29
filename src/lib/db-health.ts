import { prisma } from "./prisma";

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    // Simple query to check if database is accessible
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error disconnecting from database:", error);
  }
}

// Graceful shutdown handler
export function setupGracefulShutdown(): void {
  const cleanup = async () => {
    console.log("Gracefully closing database connections...");
    await disconnectDatabase();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("beforeExit", cleanup);
}

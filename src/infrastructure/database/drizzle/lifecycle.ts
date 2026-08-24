import { sql } from "@/infrastructure/database/drizzle/client";
import { logger } from "@/shared/logger/logger";

/**
 * Closes the database connection pool during graceful shutdown.
 */
export const closeDatabase = async (): Promise<void> => {
  await sql.end({ timeout: 5 });

  logger.info("Database connection closed");
};

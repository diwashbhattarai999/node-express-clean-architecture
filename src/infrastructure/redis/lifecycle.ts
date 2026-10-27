import { redis } from "@/infrastructure/redis/client";
import { logger } from "@/shared/logger/logger";

/**
 * Closes the Redis connection during graceful shutdown.
 */
export const closeRedis = async (): Promise<void> => {
  // If the Redis client is not open, return early.
  if (!redis.isOpen) {
    return;
  }

  await redis.quit();

  logger.info("Redis connection closed");
};

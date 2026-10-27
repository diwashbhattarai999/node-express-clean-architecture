import { createClient } from "redis";

import { env } from "@/config/env";
import { logger } from "@/shared/logger/logger";

export const redis = createClient({
  url: env.REDIS_URL,
});

redis.on("error", (error) => {
  logger.error({ error }, "Redis client error");
});

let connectPromise: Promise<void> | undefined;

/**
 * Ensures the Redis client is connected. Safe to call repeatedly.
 */
export const connectRedis = async (): Promise<void> => {
  // If the Redis client is already connected, return early.
  if (redis.isOpen) {
    return;
  }

  // If the connect promise is not set, set it to the Redis connect promise.
  if (!connectPromise) {
    connectPromise = redis.connect().then(() => undefined);
  }

  try {
    await connectPromise;
  } catch (error) {
    connectPromise = undefined;

    throw error;
  }
};

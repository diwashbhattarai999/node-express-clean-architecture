import { connectRedis, redis } from "@/infrastructure/redis/client";

/**
 * Verifies that Redis accepts commands.
 *
 * @returns `true` when Redis responds to `PING` successfully.
 */
export const checkRedisHealth = async (): Promise<boolean> => {
  try {
    await connectRedis();

    const result = await redis.ping();

    return result === "PONG";
  } catch {
    return false;
  }
};

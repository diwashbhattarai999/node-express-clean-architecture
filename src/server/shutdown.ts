import type { Server } from "node:http";

import { logger } from "@/shared/logger/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

export const createShutdownHandler = (server: Server) => {
  let isShuttingDown = false;

  return async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      logger.warn({ signal }, "Shutdown already in progress");

      return;
    }

    isShuttingDown = true;

    logger.info({ signal }, "Shutdown signal received");

    const timeout = setTimeout(() => {
      logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, "Graceful shutdown timed out");

      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    timeout.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);

            return;
          }

          resolve();
        });
      });

      logger.info("HTTP server closed successfully");

      clearTimeout(timeout);
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Failed to close HTTP server");

      clearTimeout(timeout);
      process.exit(1);
    }
  };
};

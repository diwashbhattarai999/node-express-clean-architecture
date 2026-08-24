import { createServer } from "node:http";

import { createApp } from "@/app/create-app";
import { env } from "@/config/env";
import { closeDatabase } from "@/infrastructure/database/drizzle";
import { logger } from "@/shared/logger/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const startServer = async (): Promise<void> => {
  const app = createApp();
  const server = createServer(app);

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
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

      await closeDatabase();

      clearTimeout(timeout);
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Failed during graceful shutdown");

      clearTimeout(timeout);
      process.exit(1);
    }
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("uncaughtException", (error) => {
    logger.fatal({ error }, "Uncaught exception");

    void shutdown("SIGTERM");
  });

  process.once("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection");

    void shutdown("SIGTERM");
  });

  server.listen(env.PORT, env.HOST, () => {
    logger.info(`Server started on ${env.BASE_URL} — Environment: ${env.NODE_ENV}`);
  });
};

startServer().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start server");

  process.exit(1);
});

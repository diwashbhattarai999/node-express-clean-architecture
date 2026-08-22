import { createServer } from "node:http";
import process from "node:process";

import { createApp } from "@/app/create-app";
import { env } from "@/config/env";

import { logger } from "./shared/logger/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();
const server = createServer(app);

/**
 * Starts the server.
 *
 * @returns A promise that resolves when the server is started.
 */
const startServer = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error): void => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = (): void => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);

    server.listen(env.PORT, env.HOST);
  });

  logger.info(`Server started on http://${env.HOST}:${env.PORT}`);
};

/**
 * Shuts down the server.
 *
 * @param signal - The signal that caused the server to shut down.
 * @returns A promise that resolves when the server is shut down.
 */
const shutdownServer = async (signal: NodeJS.Signals): Promise<void> => {
  logger.warn({ signal }, `Received ${signal}. Shutting down...`);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      logger.warn("Graceful shutdown timed out. Closing connections...");

      server.closeAllConnections();
      resolve();
    }, SHUTDOWN_TIMEOUT_MS);

    server.close((error) => {
      clearTimeout(timeout);

      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

let isShuttingDown = false;

/**
 * Shuts down the server.
 *
 * @param signal - The signal that caused the server to shut down.
 * @returns A promise that resolves when the server is shut down.
 */
const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  try {
    await shutdownServer(signal);

    logger.info("Server shut down successfully.");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Failed to shut down server gracefully");
    process.exit(1);
  }
};

/**
 * Shuts down the server on SIGINT.
 *
 * @returns A promise that resolves when the server is shut down.
 */
process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

/**
 * Shuts down the server on SIGTERM.
 *
 * @returns A promise that resolves when the server is shut down.
 */
process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

/**
 * Starts the server.
 * If the server fails to start, it will exit with code 1.
 */
try {
  await startServer();
} catch (error) {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
}

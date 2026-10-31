import { createWorkerRuntime } from "@/app/jobs/create-worker-runtime";
import { env } from "@/config/env";
import { closeDatabase } from "@/infrastructure/database/drizzle";
import { logger } from "@/shared/logger/logger";

const SHUTDOWN_TIMEOUT_MS = 15_000;

const startWorker = async (): Promise<void> => {
  logger.info("Starting job worker");

  const runtime = await createWorkerRuntime(env);

  logger.info(
    {
      queue: env.JOBS_QUEUE_NAME,
      prefix: env.JOBS_PREFIX,
      concurrency: env.JOBS_CONCURRENCY,
      sweepCron: env.JOBS_ACCOUNT_DELETION_SWEEP_CRON,
    },
    "Job worker started",
  );

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      logger.warn({ signal }, "Worker shutdown already in progress");
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, "Worker shutdown signal received");

    const timeout = setTimeout(() => {
      logger.error({ timeoutMs: SHUTDOWN_TIMEOUT_MS }, "Worker graceful shutdown timed out");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    timeout.unref();

    try {
      await runtime.close();
      await closeDatabase();
      clearTimeout(timeout);
      process.exit(0);
    } catch (error) {
      logger.error({ error }, "Failed during worker graceful shutdown");
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
};

startWorker().catch((error: unknown) => {
  logger.fatal({ error }, "Failed to start job worker");
  process.exit(1);
});

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import express from "express";
import type { Redis } from "ioredis";

import { env } from "@/config/env";
import { JobsProvider } from "@/config/jobs-provider";
import { createBullMqConnection } from "@/infrastructure/jobs/bullmq/connection";
import { logger } from "@/shared/logger/logger";

const REDIS_CONNECT_TIMEOUT_MS = 5_000;

const waitForRedisReady = async (connection: Redis): Promise<void> => {
  if (connection.status === "ready") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Timed out connecting to Redis for the jobs dashboard."));
    }, REDIS_CONNECT_TIMEOUT_MS);

    connection.once("ready", () => {
      clearTimeout(timeout);
      resolve();
    });

    connection.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
};

const startJobsDashboard = async (): Promise<void> => {
  if (env.JOBS_PROVIDER !== JobsProvider.BULLMQ) {
    throw new Error("Jobs dashboard requires JOBS_PROVIDER=bullmq.");
  }

  const connection = createBullMqConnection({
    url: env.REDIS_URL,
    maxRetriesPerRequest: 2,
    enableOfflineQueue: true,
  });

  await waitForRedisReady(connection);

  const queue = new Queue(env.JOBS_QUEUE_NAME, {
    connection,
    prefix: env.JOBS_PREFIX,
  });

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/");

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  const app = express();
  app.use("/", serverAdapter.getRouter());

  const host = env.JOBS_DASHBOARD_HOST;
  const port = env.JOBS_DASHBOARD_PORT;
  const url = `http://${host}:${port}`;

  const server = app.listen(port, host, () => {
    logger.info(
      { url, queue: env.JOBS_QUEUE_NAME, prefix: env.JOBS_PREFIX },
      "BullMQ dashboard listening",
    );
  });

  let isShuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.info({ signal }, "Jobs dashboard shutdown signal received");

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await queue.close();
    await connection.quit();
    process.exit(0);
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
};

startJobsDashboard().catch((error: unknown) => {
  logger.fatal({ err: error }, "Failed to start BullMQ dashboard");
  process.exit(1);
});

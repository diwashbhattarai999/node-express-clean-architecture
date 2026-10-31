import { type Job, Worker } from "bullmq";

import { createWorkerConnection } from "@/infrastructure/jobs/bullmq/connection";
import { dispatchJob } from "@/shared/jobs/dispatch-job";
import type { JobHandlerMap } from "@/shared/jobs/job-queue.port";
import { logger } from "@/shared/logger/logger";

export type CreateBullMqWorkerOptions = {
  url: string;
  prefix: string;
  queueName: string;
  concurrency: number;
  attempts: number;
  handlers: JobHandlerMap;
};

export type BullMqWorkerRuntime = {
  worker: Worker;
  close: () => Promise<void>;
};

export const createBullMqWorker = (options: CreateBullMqWorkerOptions): BullMqWorkerRuntime => {
  const connection = createWorkerConnection(options.url);

  const worker = new Worker(
    options.queueName,
    async (job: Job) => {
      logger.info({ jobId: job.id, name: job.name, attemptsMade: job.attemptsMade }, "Job started");
      await dispatchJob(options.handlers, job.name, job.data);
    },
    {
      connection,
      prefix: options.prefix,
      concurrency: options.concurrency,
      stalledInterval: 30_000,
      lockDuration: 60_000,
    },
  );

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, name: job.name }, "Job completed");
  });

  worker.on("failed", (job, error) => {
    logger.error(
      {
        err: error,
        jobId: job?.id,
        name: job?.name,
        attemptsMade: job?.attemptsMade,
        attempts: options.attempts,
      },
      "Job failed",
    );
  });

  worker.on("error", (error) => {
    logger.error({ err: error }, "Job worker error");
  });

  return {
    worker,
    close: async () => {
      await worker.close();
      connection.disconnect();
    },
  };
};

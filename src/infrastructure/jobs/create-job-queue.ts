import { Queue } from "bullmq";

import type { TEnv } from "@/config/env-schema";
import { JobsProvider } from "@/config/jobs-provider";
import { BullMqJobQueue } from "@/infrastructure/jobs/bullmq/bullmq-job-queue";
import { createProducerConnection } from "@/infrastructure/jobs/bullmq/connection";
import { createDefaultJobOptions } from "@/infrastructure/jobs/bullmq/default-job-options";
import { NoopJobQueue } from "@/infrastructure/jobs/noop-job-queue";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

let activeQueue: IJobQueue | null = null;

export const createJobQueue = (env: TEnv): IJobQueue => {
  if (activeQueue) {
    return activeQueue;
  }

  if (env.JOBS_PROVIDER === JobsProvider.NOOP) {
    activeQueue = new NoopJobQueue();
    return activeQueue;
  }

  const connection = createProducerConnection(env.REDIS_URL);
  const queue = new Queue(env.JOBS_QUEUE_NAME, {
    connection,
    prefix: env.JOBS_PREFIX,
    defaultJobOptions: createDefaultJobOptions({ attempts: env.JOBS_ATTEMPTS }),
  });

  activeQueue = new BullMqJobQueue({
    queue,
    connection,
    attempts: env.JOBS_ATTEMPTS,
  });

  return activeQueue;
};

export const closeJobQueue = async (): Promise<void> => {
  if (!activeQueue) {
    return;
  }

  await activeQueue.close();
  activeQueue = null;
};

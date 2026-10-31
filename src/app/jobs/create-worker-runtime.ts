import type { TEnv } from "@/config/env-schema";
import { JobsProvider } from "@/config/jobs-provider";
import { createBullMqWorker } from "@/infrastructure/jobs/bullmq/create-bullmq-worker";
import { closeJobQueue, createJobQueue } from "@/infrastructure/jobs/create-job-queue";
import { ApplyAccountDeletionsUseCase } from "@/modules/auth/identity/application/use-cases/apply-account-deletions.use-case";
import { PostgresIdentityRepository } from "@/modules/auth/identity/infrastructure/repositories/postgres-identity.repository";
import { JobName } from "@/shared/jobs/job-names";
import type { IJobQueue } from "@/shared/jobs/job-queue.port";

import { createJobHandlers } from "./create-job-handlers";

export type WorkerRuntime = {
  queue: IJobQueue;
  close: () => Promise<void>;
};

export const createWorkerRuntime = async (env: TEnv): Promise<WorkerRuntime> => {
  if (env.JOBS_PROVIDER !== JobsProvider.BULLMQ) {
    throw new Error("Worker requires JOBS_PROVIDER=bullmq.");
  }

  const identityRepository = new PostgresIdentityRepository();
  const applyAccountDeletionsUseCase = new ApplyAccountDeletionsUseCase(identityRepository);
  const handlers = createJobHandlers({ applyAccountDeletionsUseCase });
  const queue = createJobQueue(env);
  const worker = createBullMqWorker({
    url: env.REDIS_URL,
    prefix: env.JOBS_PREFIX,
    queueName: env.JOBS_QUEUE_NAME,
    concurrency: env.JOBS_CONCURRENCY,
    attempts: env.JOBS_ATTEMPTS,
    handlers,
  });

  await queue.upsertRepeatable(
    JobName.APPLY_DUE_ACCOUNT_DELETIONS,
    {},
    {
      jobId: JobName.APPLY_DUE_ACCOUNT_DELETIONS,
      pattern: env.JOBS_ACCOUNT_DELETION_SWEEP_CRON,
    },
  );

  return {
    queue,
    close: async () => {
      await worker.close();
      await closeJobQueue();
    },
  };
};

import type { Queue } from "bullmq";
import type { Redis } from "ioredis";

import { createDefaultJobOptions } from "@/infrastructure/jobs/bullmq/default-job-options";
import type { TJobName } from "@/shared/jobs/job-names";
import type { JobPayloadMap } from "@/shared/jobs/job-payloads";
import type {
  EnqueueJobOptions,
  IJobQueue,
  RepeatableJobOptions,
} from "@/shared/jobs/job-queue.port";

export type BullMqJobQueueOptions = {
  queue: Queue;
  connection: Redis;
  attempts: number;
};

export class BullMqJobQueue implements IJobQueue {
  public constructor(private readonly options: BullMqJobQueueOptions) {}

  public async enqueue<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options?: EnqueueJobOptions,
  ): Promise<void> {
    const jobId = options?.jobId;

    if (jobId) {
      const existing = await this.options.queue.getJob(jobId);
      if (existing) {
        return;
      }
    }

    await this.options.queue.add(name, payload, {
      ...createDefaultJobOptions({ attempts: this.options.attempts }),
      ...(jobId ? { jobId } : {}),
      ...(options?.delayMs !== undefined ? { delay: options.delayMs } : {}),
    });
  }

  public async upsertRepeatable<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options: RepeatableJobOptions,
  ): Promise<void> {
    await this.options.queue.upsertJobScheduler(
      options.jobId,
      { pattern: options.pattern },
      {
        name,
        data: payload,
        opts: createDefaultJobOptions({ attempts: this.options.attempts }),
      },
    );
  }

  public async close(): Promise<void> {
    await this.options.queue.close();
    this.options.connection.disconnect();
  }
}

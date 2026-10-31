import type { TJobName } from "@/shared/jobs/job-names";
import type { JobPayloadMap } from "@/shared/jobs/job-payloads";
import type {
  EnqueueJobOptions,
  IJobQueue,
  RepeatableJobOptions,
} from "@/shared/jobs/job-queue.port";
import { logger } from "@/shared/logger/logger";

export class NoopJobQueue implements IJobQueue {
  public async enqueue<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options?: EnqueueJobOptions,
  ): Promise<void> {
    logger.debug({ name, payload, options }, "Noop job queue enqueue");
  }

  public async upsertRepeatable<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options: RepeatableJobOptions,
  ): Promise<void> {
    logger.debug({ name, payload, options }, "Noop job queue upsertRepeatable");
  }

  public async remove(jobId: string): Promise<void> {
    logger.debug({ jobId }, "Noop job queue remove");
  }

  public async close(): Promise<void> {
    return;
  }
}

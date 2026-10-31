import type { TJobName } from "@/shared/jobs/job-names";
import type { JobPayloadMap } from "@/shared/jobs/job-payloads";

export type EnqueueJobOptions = {
  jobId?: string;
  delayMs?: number;
};

export type RepeatableJobOptions = {
  jobId: string;
  pattern: string;
};

export type JobHandlerMap = {
  [K in TJobName]: (payload: JobPayloadMap[K]) => Promise<void>;
};

export interface IJobQueue {
  enqueue<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options?: EnqueueJobOptions,
  ): Promise<void>;

  upsertRepeatable<K extends TJobName>(
    name: K,
    payload: JobPayloadMap[K],
    options: RepeatableJobOptions,
  ): Promise<void>;

  remove(jobId: string): Promise<void>;

  close(): Promise<void>;
}

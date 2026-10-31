import { z } from "zod";

import { JobName, type TJobName } from "@/shared/jobs/job-names";

export type ApplyAccountDeletionPayload = {
  userId: string;
};

export type ApplyDueAccountDeletionsPayload = Record<string, never>;

export type JobPayloadMap = {
  [JobName.APPLY_ACCOUNT_DELETION]: ApplyAccountDeletionPayload;
  [JobName.APPLY_DUE_ACCOUNT_DELETIONS]: ApplyDueAccountDeletionsPayload;
};

const applyAccountDeletionPayloadSchema = z.object({
  userId: z.uuid("User id must be a valid UUID."),
});

const applyDueAccountDeletionsPayloadSchema = z.object({}).strict();

export const parseJobPayload = <K extends TJobName>(name: K, data: unknown): JobPayloadMap[K] => {
  switch (name) {
    case JobName.APPLY_ACCOUNT_DELETION:
      return applyAccountDeletionPayloadSchema.parse(data) as JobPayloadMap[K];
    case JobName.APPLY_DUE_ACCOUNT_DELETIONS:
      return applyDueAccountDeletionsPayloadSchema.parse(data ?? {}) as JobPayloadMap[K];
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown job name: ${String(exhaustive)}`);
    }
  }
};

import { z } from "zod";

import {
  AUDIT_LOG_EXPORT_FORMATS,
  SECURITY_EVENT_OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/modules/auth/audit/application/constants/security-events";
import { JobName, type TJobName } from "@/shared/jobs/job-names";

export type ApplyAccountDeletionPayload = {
  userId: string;
};

export type ApplyDueAccountDeletionsPayload = Record<string, never>;

export type ExportAuditLogsPayload = {
  exportId: string;
  requestedBy: string;
  from: string;
  to: string;
  format: (typeof AUDIT_LOG_EXPORT_FORMATS)[number];
  userId?: string;
  eventType?: (typeof SECURITY_EVENT_TYPES)[number];
  outcome?: (typeof SECURITY_EVENT_OUTCOMES)[number];
};

export type JobPayloadMap = {
  [JobName.APPLY_ACCOUNT_DELETION]: ApplyAccountDeletionPayload;
  [JobName.APPLY_DUE_ACCOUNT_DELETIONS]: ApplyDueAccountDeletionsPayload;
  [JobName.EXPORT_AUDIT_LOGS]: ExportAuditLogsPayload;
};

const applyAccountDeletionPayloadSchema = z.object({
  userId: z.uuid("User id must be a valid UUID."),
});

const applyDueAccountDeletionsPayloadSchema = z.object({}).strict();

const exportAuditLogsPayloadSchema = z.object({
  exportId: z.uuid("Export id must be a valid UUID."),
  requestedBy: z.uuid("Requested by must be a valid UUID."),
  from: z.iso.datetime({ error: "from must be a valid ISO datetime." }),
  to: z.iso.datetime({ error: "to must be a valid ISO datetime." }),
  format: z.enum(AUDIT_LOG_EXPORT_FORMATS),
  userId: z.uuid("User id must be a valid UUID.").optional(),
  eventType: z.enum(SECURITY_EVENT_TYPES).optional(),
  outcome: z.enum(SECURITY_EVENT_OUTCOMES).optional(),
});

export const parseJobPayload = <K extends TJobName>(name: K, data: unknown): JobPayloadMap[K] => {
  switch (name) {
    case JobName.APPLY_ACCOUNT_DELETION:
      return applyAccountDeletionPayloadSchema.parse(data) as JobPayloadMap[K];
    case JobName.APPLY_DUE_ACCOUNT_DELETIONS:
      return applyDueAccountDeletionsPayloadSchema.parse(data ?? {}) as JobPayloadMap[K];
    case JobName.EXPORT_AUDIT_LOGS:
      return exportAuditLogsPayloadSchema.parse(data) as JobPayloadMap[K];
    default: {
      const exhaustive: never = name;
      throw new Error(`Unknown job name: ${String(exhaustive)}`);
    }
  }
};

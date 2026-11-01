import { z } from "zod";

import {
  AUDIT_LOG_EXPORT_FORMATS,
  SECURITY_EVENT_OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/modules/auth/audit/application/constants/security-events";

export const exportAdminAuditLogsSchema = z.object({
  body: z
    .object({
      from: z.coerce.date({ error: "from must be a valid ISO date." }),
      to: z.coerce.date({ error: "to must be a valid ISO date." }),
      format: z.enum(AUDIT_LOG_EXPORT_FORMATS, {
        error: "format must be csv or json.",
      }),
      filters: z
        .object({
          userId: z.uuid({ error: "User id must be a valid UUID." }).optional(),
          eventType: z.enum(SECURITY_EVENT_TYPES).optional(),
          outcome: z.enum(SECURITY_EVENT_OUTCOMES).optional(),
        })
        .strict()
        .optional(),
    })
    .refine((body) => body.from <= body.to, {
      message: "from must be before or equal to to.",
      path: ["to"],
    }),
});

export type ExportAdminAuditLogsSchema = typeof exportAdminAuditLogsSchema;

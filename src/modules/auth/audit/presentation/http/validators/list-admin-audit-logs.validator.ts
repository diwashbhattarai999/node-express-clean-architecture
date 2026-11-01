import { z } from "zod";

import {
  SECURITY_EVENT_OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/modules/auth/audit/application/constants/security-events";
import { paginationQuerySchema } from "@/shared/http/schemas";

export const listAdminAuditLogsSchema = z.object({
  query: paginationQuerySchema
    .extend({
      userId: z.uuid({ error: "User id must be a valid UUID." }).optional(),
      eventType: z.enum(SECURITY_EVENT_TYPES).optional(),
      outcome: z.enum(SECURITY_EVENT_OUTCOMES).optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    })
    .refine(
      (query) => query.from === undefined || query.to === undefined || query.from <= query.to,
      {
        message: "from must be before or equal to to.",
        path: ["to"],
      },
    ),
});

export type ListAdminAuditLogsSchema = typeof listAdminAuditLogsSchema;

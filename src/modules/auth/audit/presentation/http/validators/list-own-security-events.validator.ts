import { z } from "zod";

import {
  SECURITY_EVENT_OUTCOMES,
  SECURITY_EVENT_TYPES,
} from "@/modules/auth/audit/application/constants/security-events";
import { paginationQuerySchema } from "@/shared/http/schemas";

export const listOwnSecurityEventsSchema = z.object({
  query: paginationQuerySchema
    .extend({
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

export type ListOwnSecurityEventsSchema = typeof listOwnSecurityEventsSchema;

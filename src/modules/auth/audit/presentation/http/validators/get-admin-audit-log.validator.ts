import { z } from "zod";

export const getAdminAuditLogSchema = z.object({
  params: z.object({
    eventId: z.uuid({ error: "Event id must be a valid UUID." }),
  }),
});

export type GetAdminAuditLogSchema = typeof getAdminAuditLogSchema;

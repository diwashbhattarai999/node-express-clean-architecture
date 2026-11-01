import { z } from "zod";

export const getAdminAuditExportSchema = z.object({
  params: z.object({
    exportId: z.uuid({ error: "Export id must be a valid UUID." }),
  }),
});

export type GetAdminAuditExportSchema = typeof getAdminAuditExportSchema;
